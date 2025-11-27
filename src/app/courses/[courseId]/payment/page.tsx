
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export default function PaymentPage() {
    const { courseId } = useParams();
    const { firestore } = useFirebase();
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [paymentMethod, setPaymentMethod] = useState<'qr' | 'mobile' | null>(null);
    const [paymentMobileNumber, setPaymentMobileNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const courseRef = useMemoFirebase(
        () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
        [firestore, courseId]
    );
     const paymentSettingsRef = useMemoFirebase(
        () => (firestore ? doc(firestore, 'settings', 'payment') : null),
        [firestore]
    );

    const { data: course, isLoading: isCourseLoading } = useDoc(courseRef);
    const { data: paymentSettings, isLoading: isSettingsLoading } = useDoc(paymentSettingsRef);

    const isLoading = isCourseLoading || isSettingsLoading;

    const handleSubmitEnrollment = async () => {
        if (!user || !course || !firestore) {
            toast({ variant: 'destructive', title: 'त्रुटि', description: 'आवश्यक जानकारी उपलब्ध नहीं है।'});
            return;
        }
        if (!paymentMobileNumber.trim()) {
            toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया वह मोबाइल नंबर दर्ज करें जिससे आपने पेमेंट किया है।'});
            return;
        }

        setIsSubmitting(true);
        const enrollmentRef = doc(collection(firestore, 'courseEnrollments'));
        const enrollmentData = {
            userId: user.uid,
            courseId: course.id,
            enrollmentDate: serverTimestamp(),
            paymentMethod: paymentMethod,
            paymentTransactionId: paymentMobileNumber, // Using mobile number as transaction ID for now
            status: 'pending', // pending, approved, rejected
            adminApproval: false,
        };

        setDoc(enrollmentRef, enrollmentData)
        .then(() => {
            toast({ title: 'सफलता!', description: 'आपका एनरोलमेंट अनुरोध सबमिट हो गया है। 5 मिनट में पुष्टि हो जाएगी।'});
            router.push('/my-library');
        })
        .catch(error => {
            const contextualError = new FirestorePermissionError({
                operation: 'create',
                path: enrollmentRef.path,
                requestResourceData: enrollmentData,
            });
            errorEmitter.emit('permission-error', contextualError);
            toast({ variant: 'destructive', title: 'त्रुटि', description: 'एनरोलमेंट अनुरोध सबमिट करने में विफल।'});
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    }

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
    }

    if (!course) {
        return <div className="flex h-screen items-center justify-center"><p>कोर्स नहीं मिला।</p></div>;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>पेमेंट करें</CardTitle>
                    <CardDescription>कोर्स '{course.name}' में एनरोल करने के लिए।</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

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
                                <p className="text-sm">कृपया ₹{course.price} का पेमेंट करें। पेमेंट करने के बाद, जिस नंबर से आपने पेमेंट किया है, वह नीचे दर्ज करें और सबमिट करें।</p>
                                <p className="text-xs mt-2">सही पेमेंट होने पर आपका एनरोलमेंट 5 मिनट में अप्रूव हो जाएगा।</p>
                            </div>

                             <div>
                                <Input 
                                    type="tel" 
                                    placeholder="पेमेंट किया गया मोबाइल नंबर" 
                                    className="text-center" 
                                    value={paymentMobileNumber}
                                    onChange={(e) => setPaymentMobileNumber(e.target.value)}
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

    