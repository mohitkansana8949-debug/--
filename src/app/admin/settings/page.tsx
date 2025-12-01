
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';


export default function AppSettingsPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    
    // Payment settings state
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

    // App settings state
    const [appLogoUrl, setAppLogoUrl] = useState('');
    const [appUrl, setAppUrl] = useState('');
    const [youtubeFeatureEnabled, setYoutubeFeatureEnabled] = useState(true);
    const [aiDoubtSolverEnabled, setAiDoubtSolverEnabled] = useState(false);
    const [vapidKey, setVapidKey] = useState('');
    const [notificationAccessKey, setNotificationAccessKey] = useState('');
    const [isAppSubmitting, setIsAppSubmitting] = useState(false);
    
    // Refer & Earn settings
    const [referralMessage, setReferralMessage] = useState('');
    const [isReferralSubmitting, setIsReferralSubmitting] = useState(false);

    // Support Settings state
    const [supportEmail, setSupportEmail] = useState('');
    const [supportWhatsapp, setSupportWhatsapp] = useState('');
    const [isSupportSubmitting, setIsSupportSubmitting] = useState(false);

    // Firestore refs
    const paymentSettingsDocRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'payment') : null), [firestore]);
    const appSettingsDocRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
    const referralSettingsDocRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'referral') : null), [firestore]);
    const supportSettingsDocRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'support') : null), [firestore]);

    // Data hooks
    const {data: paymentSettings, isLoading: paymentSettingsLoading} = useDoc(paymentSettingsDocRef);
    const {data: appSettings, isLoading: appSettingsLoading} = useDoc(appSettingsDocRef);
    const {data: referralSettings, isLoading: referralSettingsLoading} = useDoc(referralSettingsDocRef);
    const {data: supportSettings, isLoading: supportSettingsLoading} = useDoc(supportSettingsDocRef);


    // Effects to populate state from Firestore
    useEffect(() => {
        if (paymentSettings) {
            setMobileNumber(paymentSettings.mobileNumber || '');
            setQrCodeUrl(paymentSettings.qrCodeUrl || '');
        }
    }, [paymentSettings]);

    useEffect(() => {
        if (appSettings) {
            setAppLogoUrl(appSettings.logoUrl || '');
            setAppUrl(appSettings.appUrl || '');
            setYoutubeFeatureEnabled(appSettings.youtubeFeatureEnabled !== false);
            setAiDoubtSolverEnabled(appSettings.aiDoubtSolverEnabled === true);
            setVapidKey(appSettings.vapidKey || process.env.NEXT_PUBLIC_VAPID_KEY || '');
            setNotificationAccessKey(appSettings.notificationAccessKey || '');
        }
    }, [appSettings]);

    useEffect(() => {
        if (referralSettings) {
            setReferralMessage(referralSettings.message || 'Check out Quickly Study, the best app for learning! Use my link to join: {link}');
        }
    }, [referralSettings]);
    
    useEffect(() => {
        if (supportSettings) {
            setSupportEmail(supportSettings.email || '');
            setSupportWhatsapp(supportSettings.whatsappNumber || '');
        }
    }, [supportSettings]);


    const handlePaymentSettingsUpdate = async () => {
        if (!firestore || !paymentSettingsDocRef) return;
        setIsPaymentSubmitting(true);
        const settingsUpdate = { mobileNumber, qrCodeUrl };
        
        setDoc(paymentSettingsDocRef, settingsUpdate, { merge: true }).then(() => {
            toast({ title: 'सफलता!', description: 'पेमेंट सेटिंग्स अपडेट हो गई हैं।'});
        }).catch(error => {
            const contextualError = new FirestorePermissionError({
                operation: 'update', path: paymentSettingsDocRef.path, requestResourceData: settingsUpdate,
            });
            errorEmitter.emit('permission-error', contextualError);
        }).finally(() => setIsPaymentSubmitting(false));
    }
    
    const handleAppSettingsUpdate = async () => {
        if (!firestore || !appSettingsDocRef) return;
        setIsAppSubmitting(true);
        const settingsUpdate = { 
            logoUrl: appLogoUrl, 
            appUrl: appUrl,
            youtubeFeatureEnabled: youtubeFeatureEnabled,
            aiDoubtSolverEnabled: aiDoubtSolverEnabled,
            vapidKey: vapidKey,
            notificationAccessKey: notificationAccessKey,
        };
        
        setDoc(appSettingsDocRef, settingsUpdate, { merge: true }).then(() => {
            toast({ title: 'सफलता!', description: 'ऐप सेटिंग्स अपडेट हो गई हैं।'});
        }).catch(error => {
            const contextualError = new FirestorePermissionError({
                operation: 'update', path: appSettingsDocRef.path, requestResourceData: settingsUpdate,
            });
            errorEmitter.emit('permission-error', contextualError);
        }).finally(() => setIsAppSubmitting(false));
    }
    
    const handleReferralSettingsUpdate = async () => {
        if (!firestore || !referralSettingsDocRef) return;
        setIsReferralSubmitting(true);
        const settingsUpdate = { message: referralMessage };
        
        setDoc(referralSettingsDocRef, settingsUpdate, { merge: true }).then(() => {
            toast({ title: 'सफलता!', description: 'Referral message updated.'});
        }).catch(error => {
            const contextualError = new FirestorePermissionError({
                operation: 'update', path: referralSettingsDocRef.path, requestResourceData: settingsUpdate,
            });
            errorEmitter.emit('permission-error', contextualError);
        }).finally(() => setIsReferralSubmitting(false));
    }

    const handleSupportSettingsUpdate = async () => {
        if (!firestore || !supportSettingsDocRef) return;
        setIsSupportSubmitting(true);
        const settingsUpdate = { email: supportEmail, whatsappNumber: supportWhatsapp };
        
        setDoc(supportSettingsDocRef, settingsUpdate, { merge: true }).then(() => {
            toast({ title: 'सफलता!', description: 'Support settings have been updated.'});
        }).catch(error => {
            const contextualError = new FirestorePermissionError({
                operation: 'update', path: supportSettingsDocRef.path, requestResourceData: settingsUpdate,
            });
            errorEmitter.emit('permission-error', contextualError);
        }).finally(() => setIsSupportSubmitting(false));
    }


    return (
        <Tabs defaultValue="app" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="app">ऐप सेटिंग्स</TabsTrigger>
                <TabsTrigger value="payment">पेमेंट सेटिंग्स</TabsTrigger>
                <TabsTrigger value="referral">Referral</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>
            <TabsContent value="app">
                 <Card>
                    <CardHeader>
                        <CardTitle>ऐप सेटिंग्स</CardTitle>
                        <CardDescription>ऐप का लोगो, फ़ीचर और अन्य जानकारी मैनेज करें।</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {appSettingsLoading ? <SettingsSkeleton /> : (
                            <>
                                <div className="space-y-4">
                                    <Label htmlFor="app-logo-url">ऐप लोगो URL</Label>
                                     {appLogoUrl && (
                                        <div className="mt-2 w-48 h-48 relative">
                                            <Image src={appLogoUrl} alt="App Logo Preview" layout="fill" objectFit="contain" className="rounded-md border p-1" />
                                        </div>
                                    )}
                                    <Input id="app-logo-url" type="text" placeholder="https://example.com/logo.png" value={appLogoUrl} onChange={e => setAppLogoUrl(e.target.value)} />
                                    <p className="text-sm text-muted-foreground">यह लोगो PWA (प्रोग्रेसिव वेब ऐप) के लिए इस्तेमाल होगा।</p>
                                </div>
                                <div className="space-y-4">
                                    <Label htmlFor="app-url">App Base URL</Label>
                                    <Input id="app-url" type="text" placeholder="https://yourapp.com" value={appUrl} onChange={e => setAppUrl(e.target.value)} />
                                    <p className="text-sm text-muted-foreground">This is used to generate referral links. Do not include a trailing slash.</p>
                                </div>
                                 <div className="space-y-4 rounded-lg border p-4">
                                    <h4 className="font-medium">Feature Flags</h4>
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>YouTube Feature</Label>
                                            <p className="text-xs text-muted-foreground">Enable or disable the YouTube section on the home page.</p>
                                        </div>
                                        <Switch checked={youtubeFeatureEnabled} onCheckedChange={setYoutubeFeatureEnabled} />
                                    </div>
                                    <div className="flex flex-row items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>AI Doubt Solver</Label>
                                            <p className="text-xs text-muted-foreground">Show or hide the AI Doubt Solver card on the home page.</p>
                                        </div>
                                        <Switch checked={aiDoubtSolverEnabled} onCheckedChange={setAiDoubtSolverEnabled} />
                                    </div>
                                </div>
                                 <div className="space-y-4 rounded-lg border p-4">
                                    <h4 className="font-medium">Push Notifications</h4>
                                    <div className="space-y-2">
                                        <Label htmlFor="vapid-key">VAPID Key</Label>
                                        <Input id="vapid-key" type="password" placeholder="Your FCM VAPID Key" value={vapidKey} onChange={e => setVapidKey(e.target.value)} />
                                    </div>
                                </div>
                            </>
                        )}
                        <Button onClick={handleAppSettingsUpdate} disabled={isAppSubmitting || appSettingsLoading}>
                            {isAppSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> अपडेट हो रहा है...</> : 'ऐप सेटिंग्स अपडेट करें'}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="payment">
                <Card>
                    <CardHeader>
                        <CardTitle>पेमेंट सेटिंग्स</CardTitle>
                        <CardDescription>पेमेंट के लिए QR कोड और मोबाइल नंबर सेट करें।</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {paymentSettingsLoading ? <SettingsSkeleton /> : (
                            <>
                                <div className="space-y-4">
                                    <Label htmlFor="qr-code-url">पेमेंट QR कोड URL</Label>
                                    {qrCodeUrl && (
                                        <div className="mt-2 w-48 h-48 relative">
                                            <Image src={qrCodeUrl} alt="QR Code Preview" layout="fill" objectFit="contain" className="rounded-md border p-1" />
                                        </div>
                                    )}
                                    <Input id="qr-code-url" type="text" placeholder="https://example.com/qr.png" value={qrCodeUrl} onChange={e => setQrCodeUrl(e.target.value)} />
                                    <p className="text-sm text-muted-foreground">यहां अपना पेमेंट QR कोड का लिंक पेस्ट करें।</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="mobile-number">पेमेंट मोबाइल नंबर</Label>
                                    <Input id="mobile-number" type="tel" placeholder="जैसे, 9876543210" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                                    <p className="text-sm text-muted-foreground">यहां अपना पेमेंट के लिए मोबाइल नंबर दर्ज करें।</p>
                                </div>
                            </>
                        )}
                        <Button onClick={handlePaymentSettingsUpdate} disabled={isPaymentSubmitting || paymentSettingsLoading}>
                            {isPaymentSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> अपडेट हो रहा है...</> : 'पेमेंट सेटिंग्स अपडेट करें'}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="referral">
                 <Card>
                    <CardHeader>
                        <CardTitle>Refer &amp; Earn Settings</CardTitle>
                        <CardDescription>Customize the message sent to users when they refer someone.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {referralSettingsLoading ? <SettingsSkeleton /> : (
                            <>
                                <div className="space-y-4">
                                    <Label htmlFor="referral-message">WhatsApp Referral Message</Label>
                                    <Textarea id="referral-message" value={referralMessage} onChange={(e) => setReferralMessage(e.target.value)} rows={5} />
                                    <p className="text-sm text-muted-foreground">Use {'{link}'} as a placeholder for the unique referral link. It will be replaced automatically.</p>
                                </div>
                            </>
                        )}
                        <Button onClick={handleReferralSettingsUpdate} disabled={isReferralSubmitting || referralSettingsLoading}>
                            {isReferralSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Referral Message'}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
             <TabsContent value="support">
                 <Card>
                    <CardHeader>
                        <CardTitle>Support Settings</CardTitle>
                        <CardDescription>Manage the contact details for user support.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {supportSettingsLoading ? <SettingsSkeleton /> : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="support-email">Support Email</Label>
                                    <Input id="support-email" type="email" placeholder="support@example.com" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="support-whatsapp">Support WhatsApp Number</Label>
                                    <Input id="support-whatsapp" type="tel" placeholder="919876543210" value={supportWhatsapp} onChange={(e) => setSupportWhatsapp(e.target.value)} />
                                </div>
                            </>
                        )}
                        <Button onClick={handleSupportSettingsUpdate} disabled={isSupportSubmitting || supportSettingsLoading}>
                            {isSupportSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Support Settings'}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
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
