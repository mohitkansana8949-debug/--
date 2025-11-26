
'use client';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function PaymentPage() {
    const { courseId } = useParams();
    const firestore = useFirestore();
    const { user } = useUser();

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
                <CardContent className="space-y-6 text-center">
                    {paymentSettings?.qrCodeUrl ? (
                         <div className="p-4 border rounded-lg bg-card flex flex-col items-center">
                            <Image 
                                src={paymentSettings.qrCodeUrl}
                                alt="Payment QR Code"
                                width={250}
                                height={250}
                                className="rounded-md"
                            />
                        </div>
                    ) : (
                        <div className="p-8 border rounded-lg bg-muted text-muted-foreground">
                            <p>पेमेंट QR कोड जल्द ही उपलब्ध होगा।</p>
                        </div>
                    )}
                   
                    <div className="rounded-lg border bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                        <h4 className="font-bold">महत्वपूर्ण निर्देश</h4>
                        <p className="text-sm">कृपया इस QR कोड पर ₹{course.price} का पेमेंट करें। पेमेंट करने के बाद, जिस नंबर से आपने पेमेंट किया है, वह नीचे दर्ज करें और सबमिट करें।</p>
                    </div>

                     <div>
                        <Input type="tel" placeholder="पेमेंट किया गया मोबाइल नंबर दर्ज करें" className="text-center" />
                        <Button className="mt-4 w-full">सबमिट करें और एनरोलमेंट की पुष्टि करें</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    