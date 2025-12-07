
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, getDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useEffect, Suspense } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import type { Coupon, Address, CartItem, BookOrder } from '@/lib/types';
import { useCart } from '@/hooks/use-cart';

function BookPaymentComponent() {
    const router = useRouter();
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();
    const { cart, clearCart } = useCart();
    
    const [shippingAddress, setShippingAddress] = useState<Address | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'qr' | 'mobile' | null>(null);
    const [paymentMobileNumber, setPaymentMobileNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [discount, setDiscount] = useState(0);

    const paymentSettingsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'settings', 'payment') : null),
        [firestore]
    );
    const { data: paymentSettings, isLoading: isSettingsLoading } = useDoc(paymentSettingsRef);

    useEffect(() => {
        const storedAddress = localStorage.getItem('shippingAddress');
        if (storedAddress) {
            setShippingAddress(JSON.parse(storedAddress));
        } else {
            toast({ variant: 'destructive', title: 'Address not found!', description: 'Redirecting to checkout.'});
            router.replace('/checkout');
        }

        if (cart.length === 0) {
            toast({ variant: 'destructive', title: 'Cart is empty!', description: 'Redirecting to Bookshala.'});
            router.replace('/bookshala');
        }
    }, [router, cart, toast]);
    
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const total = subtotal - discount;

     const handleApplyCoupon = async () => {
        if (!firestore || !couponCode.trim()) {
            toast({ variant: 'destructive', title: 'Invalid Coupon', description: 'Please enter a coupon code.'});
            return;
        }

        const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            toast({ variant: 'destructive', title: 'Invalid Coupon', description: 'This coupon code does not exist.'});
            setAppliedCoupon(null);
            setDiscount(0);
            return;
        }

        const coupon = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Coupon;

        if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
            toast({ variant: 'destructive', title: 'Coupon Expired', description: 'This coupon has expired.'});
            return;
        }
        
        if (coupon.maxUses && (coupon.uses || 0) >= coupon.maxUses) {
            toast({ variant: 'destructive', title: 'Coupon Limit Reached', description: 'This coupon has reached its usage limit.'});
            return;
        }
        
        let calculatedDiscount = 0;
        if (coupon.discountType === 'percentage') {
            calculatedDiscount = subtotal * (coupon.discountValue / 100);
        } else { // fixed
            calculatedDiscount = coupon.discountValue;
        }

        if (calculatedDiscount > subtotal) calculatedDiscount = subtotal;
        
        setDiscount(calculatedDiscount);
        setAppliedCoupon(coupon);
        toast({ title: 'Coupon Applied!', description: `You saved ₹${calculatedDiscount.toFixed(2)}!`});
    };

    const handleSubmitOrder = async () => {
        if (!user || !shippingAddress || !firestore) {
            toast({ variant: 'destructive', title: 'त्रुटि', description: 'आवश्यक जानकारी उपलब्ध नहीं है।'});
            return;
        }
        if (!paymentMobileNumber.trim() || paymentMobileNumber.trim().length !== 10) {
            toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'});
            return;
        }

        setIsSubmitting(true);
        const batch = writeBatch(firestore);
        
        const orderRef = doc(collection(firestore, 'bookOrders'));
        const orderData: Omit<BookOrder, 'id'> = {
            userId: user.uid,
            items: cart,
            subtotal,
            discount,
            total,
            status: 'Pending', // Set initial status to Pending
            createdAt: serverTimestamp(),
            paymentMethod: paymentMethod || 'unknown',
            paymentId: paymentMobileNumber,
            ...(appliedCoupon && {
                appliedCoupon: {
                    code: appliedCoupon.code,
                    discountAmount: discount,
                }
            })
        };
        batch.set(orderRef, orderData);
        
        if (appliedCoupon) {
            const couponRef = doc(firestore, 'coupons', appliedCoupon.id);
            const couponSnap = await getDoc(couponRef);
            const currentUses = couponSnap.data()?.uses || 0;
            batch.update(couponRef, { uses: currentUses + 1 });
        }

        try {
            await batch.commit();
            toast({ title: 'सफलता!', description: 'आपका ऑर्डर सफलतापूर्वक प्लेस हो गया है। एडमिन द्वारा पुष्टि के बाद यह आपके "My Purchases" में दिखाई देगा।'});
            clearCart();
            localStorage.removeItem('shippingAddress');
            router.push('/');
        } catch (error) {
            const contextualError = new FirestorePermissionError({
                operation: 'create',
                path: 'bookOrders',
                requestResourceData: orderData,
            });
            errorEmitter.emit('permission-error', contextualError);
            toast({ variant: 'destructive', title: 'त्रुटि', description: 'ऑर्डर प्लेस करने में विफल।'});
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isSettingsLoading || !shippingAddress) {
        return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>पेमेंट करें</CardTitle>
                    <CardDescription>अपने बुक ऑर्डर के लिए पेमेंट पूरा करें।</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center">
                        <Button size="lg" disabled>
                           <span>अभी खरीदें -</span>
                           {discount > 0 && <span className="line-through text-muted-foreground/80 ml-2">₹{subtotal.toFixed(2)}</span>}
                           <span className="ml-2">₹{total.toFixed(2)}</span>
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label>Apply Coupon</Label>
                        <div className="flex gap-2">
                            <Input placeholder="Enter coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} disabled={!!appliedCoupon} />
                            <Button onClick={handleApplyCoupon} disabled={!!appliedCoupon}>Apply</Button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <p className="font-semibold">पेमेंट मेथड चुनें:</p>
                        <RadioGroup onValueChange={(value) => setPaymentMethod(value as 'qr' | 'mobile')} className="flex gap-4">
                            <Label htmlFor="qr" className="flex items-center gap-2 p-4 border rounded-md cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary flex-1 justify-center">
                                <RadioGroupItem value="qr" id="qr" />
                                QR कोड
                            </Label>
                            <Label htmlFor="mobile" className="flex items-center gap-2 p-4 border rounded-md cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary flex-1 justify-center">
                                <RadioGroupItem value="mobile" id="mobile" />
                                मोबाइल नंबर
                            </Label>
                        </RadioGroup>
                    </div>

                    {paymentMethod === 'qr' && (
                        paymentSettings?.qrCodeUrl ? (
                             <div className="p-4 border rounded-lg bg-card flex flex-col items-center animate-in fade-in-50">
                                <Image 
                                    src={paymentSettings.qrCodeUrl}
                                    alt="Payment QR Code"
                                    width={250}
                                    height={250}
                                    className="rounded-md"
                                />
                            </div>
                        ) : (
                            <div className="p-8 border rounded-lg bg-muted text-muted-foreground animate-in fade-in-50">
                                <p>पेमेंट QR कोड जल्द ही उपलब्ध होगा।</p>
                            </div>
                        )
                    )}

                    {paymentMethod === 'mobile' && (
                        paymentSettings?.mobileNumber ? (
                             <div className="p-4 border rounded-lg bg-card flex flex-col items-center animate-in fade-in-50">
                                <p className="text-muted-foreground">इस नंबर पर पेमेंट करें:</p>
                                <p className="text-2xl font-bold tracking-widest">{paymentSettings.mobileNumber}</p>
                            </div>
                        ) : (
                            <div className="p-8 border rounded-lg bg-muted text-muted-foreground animate-in fade-in-50">
                                <p>पेमेंट मोबाइल नंबर जल्द ही उपलब्ध होगा।</p>
                            </div>
                        )
                    )}
                   
                    {paymentMethod && (
                        <>
                            <div className="rounded-lg border bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-100 text-center animate-in fade-in-50">
                                <h4 className="font-bold">महत्वपूर्ण निर्देश</h4>
                                <p className="text-sm">कृपया ₹{total.toFixed(2)} का पेमेंट करें। पेमेंट करने के बाद, जिस नंबर से आपने पेमेंट किया है, वह नीचे दर्ज करें और सबमिट करें।</p>
                                <p className="text-xs mt-2">एडमिन द्वारा पुष्टि के बाद आपका ऑर्डर शिप किया जाएगा।</p>
                            </div>

                             <div>
                                <Input 
                                    type="tel"
                                    maxLength={10}
                                    placeholder="पेमेंट किया गया मोबाइल नंबर" 
                                    className="text-center" 
                                    value={paymentMobileNumber}
                                    onChange={(e) => setPaymentMobileNumber(e.target.value.replace(/\D/g, ''))}
                                />
                                <Button className="mt-4 w-full" onClick={handleSubmitOrder} disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin"/> सबमिट हो रहा है...</> : 'ऑर्डर कन्फर्म करें'}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function BookPaymentPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>}>
            <BookPaymentComponent />
        </Suspense>
    )
}
