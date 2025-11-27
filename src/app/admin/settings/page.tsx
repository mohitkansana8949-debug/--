
'use client';

import { useState, ChangeEvent, useMemo, useEffect } from 'react';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppSettingsPage() {
    const { firestore, storage } = useFirebase();
    const { toast } = useToast();
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
    const [qrPreview, setQrPreview] = useState<string | null>(null);
    const [mobileNumber, setMobileNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'settings', 'payment') : null),
      [firestore]
    );
    const {data: paymentSettings, isLoading: settingsLoading} = useDoc(settingsDocRef);

    useEffect(() => {
        if (paymentSettings) {
            setMobileNumber(paymentSettings.mobileNumber || '');
            setQrPreview(paymentSettings.qrCodeUrl || null);
        }
    }, [paymentSettings]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setQrCodeFile(file);
            setQrPreview(URL.createObjectURL(file));
        }
    }

    const handleSettingsUpdate = async () => {
        if (!firestore || !storage || !settingsDocRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firebase not configured.'});
            return;
        }

        setIsSubmitting(true);
        try {
            const settingsUpdate: any = {};
            if (mobileNumber) {
                settingsUpdate.mobileNumber = mobileNumber;
            }
            
            if (qrCodeFile) {
                const storageRef = ref(storage, 'app_settings/payment_qr_code.png');
                await uploadBytes(storageRef, qrCodeFile);
                const qrCodeUrl = await getDownloadURL(storageRef);
                settingsUpdate.qrCodeUrl = qrCodeUrl;
            }

            if (Object.keys(settingsUpdate).length === 0) {
                 toast({ title: 'कोई बदलाव नहीं', description: 'अपडेट करने के लिए कोई नई जानकारी नहीं है।'});
                 setIsSubmitting(false);
                 return;
            }
            
            await setDoc(settingsDocRef, settingsUpdate, { merge: true });
            
            toast({ title: 'सफलता!', description: 'पेमेंट सेटिंग्स अपडेट हो गई हैं।'});
            setQrCodeFile(null);

        } catch (error: any) {
            console.error('Error updating settings:', error);
            const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: settingsDocRef.path,
                requestResourceData: {mobileNumber}, // only send relevant data
            });
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>पेमेंट सेटिंग्स</CardTitle>
                    <CardDescription>पेमेंट के लिए QR कोड और मोबाइल नंबर सेट करें।</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    {settingsLoading ? <SettingsSkeleton /> : (
                        <>
                            <div className="space-y-4">
                                <Label htmlFor="qr-code-upload">पेमेंट QR कोड</Label>
                                {qrPreview && (
                                    <div className="mt-2 w-48 h-48 relative">
                                        <Image src={qrPreview} alt="QR Code Preview" layout="fill" objectFit="contain" className="rounded-md border p-1" />
                                    </div>
                                )}
                                <Input id="qr-code-upload" type="file" accept="image/png, image/jpeg" onChange={handleFileChange} />
                                <p className="text-sm text-muted-foreground">यहां अपना पेमेंट QR कोड अपलोड करें।</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mobile-number">पेमेंट मोबाइल नंबर</Label>
                                <Input id="mobile-number" type="tel" placeholder="जैसे, 9876543210" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                                <p className="text-sm text-muted-foreground">यहां अपना पेमेंट के लिए मोबाइल नंबर दर्ज करें।</p>
                            </div>
                        </>
                    )}
                    <Button onClick={handleSettingsUpdate} disabled={isSubmitting || settingsLoading}>
                        {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> अपडेट हो रहा है...</> : 'सेटिंग्स अपडेट करें'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function SettingsSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="w-48 h-48" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )
}
