'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Gift, Users, Share2, Loader, Copy } from 'lucide-react';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function ReferAndEarnPage() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isSharing, setIsSharing] = useState(false);

    const referralSettingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'referral') : null), [firestore]);
    const { data: referralSettings, isLoading: settingsLoading } = useDoc(referralSettingsRef);

    const referralLink = `https://your-app-url.com/signup?ref=${user?.uid || ''}`;

    const handleShare = async () => {
        setIsSharing(true);
        const messageTemplate = referralSettings?.message || 'Check out Quickly Study, the best app for learning! Use my link to join: {link}';
        const message = messageTemplate.replace('{link}', referralLink);
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Refer a Friend to Quickly Study',
                    text: message,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else if (navigator.clipboard) {
             try {
                await navigator.clipboard.writeText(message);
                toast({ title: 'Copied to Clipboard!', description: 'The referral message has been copied.' });
             } catch (error) {
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not copy message.' });
             }
        } else {
            // Fallback for browsers that don't support sharing or clipboard API
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
        setIsSharing(false);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            toast({ title: 'Link Copied!' });
        }).catch(() => {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not copy link.' });
        });
    };

    return (
        <div className="container mx-auto p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Trophy className="h-8 w-8 text-yellow-500" /> Refer & Earn</h1>
                <p className="text-muted-foreground">Invite friends and earn rewards!</p>
            </div>

            <Card className="bg-gradient-to-br from-primary/20 to-background">
                <CardHeader>
                    <CardTitle>Your Referral Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-card rounded-lg">
                        <p className="text-3xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">Friends Joined</p>
                    </div>
                    <div className="p-4 bg-card rounded-lg">
                        <p className="text-3xl font-bold">0</p>
                        <p className="text-sm text-muted-foreground">Points Earned</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Share Your Link</CardTitle>
                    <CardDescription>Share your unique link with friends. For every friend that joins, you earn points!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                        <p className="text-sm font-mono text-muted-foreground flex-1 truncate">{referralLink}</p>
                        <Button variant="ghost" size="icon" onClick={copyToClipboard}><Copy className="h-4 w-4" /></Button>
                    </div>
                    <Button onClick={handleShare} className="w-full" disabled={isSharing || settingsLoading}>
                        {isSharing || settingsLoading ? <Loader className="animate-spin" /> : <Share2 className="mr-2" />}
                        Share via WhatsApp & More
                    </Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="text-primary"/>Rewards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <p><span className="font-bold">1 friend joins</span> = 10 Points</p>
                   <p><span className="font-bold">200 Points</span> = 1 Free Test Series</p>
                   <Button className="mt-4 w-full" disabled>Redeem (Coming Soon)</Button>
                </CardContent>
            </Card>
        </div>
    );
}
