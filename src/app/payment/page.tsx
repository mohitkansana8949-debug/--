
'use client';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
import type { Enrollment, Coupon } from '@/lib/types';


function PaymentComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();

    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType');

    const [paymentMethod, setPaymentMethod] = useState<'qr' | 'mobile' | null>(null);
    const [paymentMobileNumber, setPaymentMobileNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [itemData, setItemData] = useState<any>(null);
    const [isItemLoading, setIsItemLoading] = useState(true);
    
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
    const [discount, setDiscount] = useState(0);

    const paymentSettingsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'settings', 'payment') : null),
        [firestore]
    );
    const { data: paymentSettings, isLoading: isSettingsLoading } = useDoc(paymentSettingsRef);

    useEffect(() => {
        const fetchItemData = async () => {
            if (!firestore || !itemId || !itemType) {
                setIsItemLoading(false);
                return;
            }
            setIsItemLoading(true);
            try {
                const collectionName = itemType + 's';
                const itemRef = doc(firestore, collectionName, itemId);
                const itemSnap = await getDoc(itemRef);
                if (itemSnap.exists()) {
                    setItemData({ id: itemSnap.id, ...itemSnap.data() });
                } else {
                    toast({ variant: 'destructive', title: 'त्रुटि', description: 'यह आइटम अब उपलब्ध नहीं है।' });
                    router.back();
                }
            } catch (e) {
                console.error("Error fetching item data:", e);
                toast({ variant: 'destructive', title: 'त्रुटि', description: 'आइटम लोड करने में विफल।'});
            } finally {
                setIsItemLoading(false);
            }
        };
        fetchItemData();
    }, [firestore, itemId, itemType, router, toast]);

    const finalPrice = itemData ? itemData.price - discount : 0;
    const isLoading = isItemLoading || isSettingsLoading;

     const handleApplyCoupon = async () => {
        if (!firestore || !couponCode.trim() || !itemData) {
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

        // Check expiry
        if (coupon.expiresAt && coupon.expiresAt.toDate() < new Date()) {
            toast({ variant: 'destructive', title: 'Coupon Expired', description: 'This coupon has expired.'});
            return;
        }
        
        // Check usage limit
        if (coupon.maxUses && (coupon.uses || 0) >= coupon.maxUses) {
            toast({ variant: 'destructive', title: 'Coupon Limit Reached', description: 'This coupon has reached its usage limit.'});
            return;
        }
        
        let calculatedDiscount = 0;
        if (coupon.discountType === 'percentage') {
            calculatedDiscount = itemData.price * (coupon.discountValue / 100);
        } else { // fixed
            calculatedDiscount = coupon.discountValue;
        }

        if (calculatedDiscount > itemData.price) {
            calculatedDiscount = itemData.price;
        }
        
        setDiscount(calculatedDiscount);
        setAppliedCoupon(coupon);
        toast({ title: 'Coupon Applied!', description: `You saved ₹${calculatedDiscount.toFixed(2)}!`});
    };

    const handleSubmitEnrollment = async () => {
        if (!user || !itemData || !firestore || !itemType) {
            toast({ variant: 'destructive', title: 'त्रुटि', description: 'आवश्यक जानकारी उपलब्ध नहीं है।'});
            return;
        }
        if (!paymentMobileNumber.trim() || paymentMobileNumber.trim().length !== 10) {
            toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'});
            return;
        }

        setIsSubmitting(true);
        const batch = writeBatch(firestore);

        const enrollmentRef = doc(collection(firestore, 'enrollments'));
        const enrollmentData: Omit<Enrollment, 'id'> = {
            userId: user.uid,
            itemId: itemData.id,
            itemType: itemType as Enrollment['itemType'],
            itemName: itemData.name, // Denormalized name
            enrollmentDate: serverTimestamp(),
            paymentMethod: paymentMethod || 'unknown',
            paymentTransactionId: paymentMobileNumber, 
            status: 'pending', // Status is 'pending' for manual verification
            ...(appliedCoupon && {
                appliedCoupon: {
                    code: appliedCoupon.code,
                    discountAmount: discount,
                }
            })
        };
        batch.set(enrollmentRef, enrollmentData);
        
        if (appliedCoupon) {
            const couponRef = doc(firestore, 'coupons', appliedCoupon.id);
            const couponSnap = await getDoc(couponRef);
            const currentUses = couponSnap.data()?.uses || 0;
            batch.update(couponRef, { uses: currentUses + 1 });
        }

        try {
            await batch.commit();
            toast({ title: 'सफलता!', description: 'आपका अनुरोध सबमिट हो गया है। एडमिन द्वारा पुष्टि के बाद एनरोलमेंट आपकी लाइब्रेरी में दिखाई देगा।'});
            router.push('/my-library');
        } catch (error) {
            const contextualError = new FirestorePermissionError({
                operation: 'create',
                path: 'enrollments',
                requestResourceData: enrollmentData,
            });
            errorEmitter.emit('permission-error', contextualError);
            toast({ variant: 'destructive', title: 'त्रुटि', description: 'एनरोलमेंट अनुरोध सबमिट करने में विफल।'});
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
    }

    if (!itemData) {
        return <div className="flex h-screen items-center justify-center"><p>आइटम नहीं मिला।</p></div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>पेमेंट करें</CardTitle>
                    <CardDescription>'{itemData.name}' में एनरोल करने के लिए।</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center">
                        <Button size="lg" disabled>
                           <span>अभी खरीदें -</span>
                           {discount > 0 && <span className="line-through text-muted-foreground/80 ml-2">₹{itemData.price}</span>}
                           <span className="ml-2">₹{finalPrice.toFixed(2)}</span>
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
                                <p className="text-sm">कृपया ₹{finalPrice.toFixed(2)} का पेमेंट करें। पेमेंट करने के बाद, जिस नंबर से आपने पेमेंट किया है, वह नीचे दर्ज करें और सबमिट करें।</p>
                                <p className="text-xs mt-2">एडमिन द्वारा पुष्टि के बाद आपका एनरोलमेंट अप्रूव हो जाएगा।</p>
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
                                <Button className="mt-4 w-full" onClick={handleSubmitEnrollment} disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin"/> सबमिट हो रहा है...</> : 'सबमिट करें और एनरोलमेंट की पुष्टि करें'}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function PaymentPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>}>
            <PaymentComponent />
        </Suspense>
    )
}
