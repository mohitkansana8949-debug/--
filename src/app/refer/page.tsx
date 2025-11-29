'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Gift, Users, Share2, Loader, Copy, BadgeCheck, XCircle } from 'lucide-react';
import { useUser, useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, writeBatch, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label";

type PaidTest = {
  id: string;
  name: string;
  price: number;
};

function RedeemDialog({ userPoints, userId }: { userPoints: number, userId: string }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<string | null>(null);
    const [isRedeeming, setIsRedeeming] = useState(false);
    
    const testsQuery = useMemoFirebase(
      () => firestore ? query(collection(firestore, 'tests'), where('isFree', '==', false)) : null, 
      [firestore]
    );
    const { data: paidTests, isLoading: testsLoading } = useCollection(testsQuery);

    const handleRedeem = async () => {
        if (!firestore || !selectedTest || !userId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a test series to redeem.' });
            return;
        }
        if (userPoints < 200) {
            toast({ variant: 'destructive', title: 'Insufficient Points', description: 'You need at least 200 points to redeem.' });
            return;
        }
        
        setIsRedeeming(true);
        const selectedTestData = paidTests?.find(t => t.id === selectedTest);
        if (!selectedTestData) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected test not found.' });
            setIsRedeeming(false);
            return;
        }

        try {
            const batch = writeBatch(firestore);

            // 1. Deduct points
            const pointsRef = doc(firestore, 'referralPoints', userId);
            batch.update(pointsRef, {
                points: userPoints - 200
            });

            // 2. Create a new enrollment for the test series
            const enrollmentRef = doc(collection(firestore, 'enrollments'));
            batch.set(enrollmentRef, {
                userId: userId,
                itemId: selectedTest,
                itemType: 'test',
                itemName: selectedTestData.name,
                enrollmentDate: new Date(),
                paymentMethod: 'referral_points',
                paymentTransactionId: `redeemed_${userId}_${Date.now()}`,
                status: 'approved',
            });
            
            await batch.commit();

            toast({ title: 'Success!', description: `You have successfully redeemed "${selectedTestData.name}".`});
            setOpen(false);

        } catch (error) {
            console.error("Redemption error: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not complete the redemption. Please try again.' });
        } finally {
            setIsRedeeming(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="mt-4 w-full" disabled={userPoints < 200}>
                    Redeem (200 Points)
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Redeem a Free Test Series</DialogTitle>
                    <DialogDescription>
                        You have {userPoints} points. Select one test series to unlock for free.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[300px] overflow-y-auto pr-4">
                    {testsLoading ? <div className="flex justify-center p-4"><Loader className="animate-spin" /></div> : 
                    paidTests && paidTests.length > 0 ? (
                         <RadioGroup onValueChange={setSelectedTest} value={selectedTest || undefined}>
                            {paidTests.map((test: PaidTest) => (
                                <Label key={test.id} htmlFor={test.id} className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-muted has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                    <span>{test.name}</span>
                                    <RadioGroupItem value={test.id} id={test.id} />
                                </Label>
                            ))}
                        </RadioGroup>
                    ) : (
                        <p className="text-muted-foreground text-center p-4">No paid test series available to redeem.</p>
                    )}
                </div>
                 <Button onClick={handleRedeem} disabled={!selectedTest || isRedeeming}>
                    {isRedeeming ? <Loader className="animate-spin mr-2"/> : null}
                    Redeem Now
                </Button>
            </DialogContent>
        </Dialog>
    )
}

export default function ReferAndEarnPage() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isSharing, setIsSharing] = useState(false);
    const [appUrl, setAppUrl] = useState('');
    const [referralLink, setReferralLink] = useState('');

    const appSettingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
    const { data: appSettings, isLoading: settingsLoading } = useDoc(appSettingsRef);

    const pointsRef = useMemoFirebase(() => (user ? doc(firestore, 'referralPoints', user.uid) : null), [user, firestore]);
    const { data: referralPointsData, isLoading: pointsLoading } = useDoc(pointsRef);

    const referralsQuery = useMemoFirebase(
      () => user ? query(collection(firestore, 'referrals'), where('referrerId', '==', user.uid)) : null,
      [user, firestore]
    );
    const { data: referrals, isLoading: referralsLoading } = useCollection(referralsQuery);

    useEffect(() => {
        let url = '';
        if (appSettings?.appUrl) {
            url = appSettings.appUrl;
        } else if (typeof window !== 'undefined') {
            url = window.location.origin;
        }
        setAppUrl(url);

        if (user && url) {
            setReferralLink(`${url}/signup?ref=${user.uid}`);
        }
    }, [appSettings, user]);
    
    const referralCount = referrals?.length || 0;
    const pointsEarned = referralPointsData?.points || 0;

    const handleShare = async () => {
        if (!referralLink) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate referral link. Are you logged in?' });
            return;
        }

        setIsSharing(true);
        const messageTemplate = appSettings?.message || 'Check out Quickly Study, the best app for learning! Use my link to join: {link}';
        const message = messageTemplate.replace('{link}', referralLink);
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Refer a Friend to Quickly Study',
                    text: message,
                });
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                } else {
                     toast({ title: 'Sharing was cancelled.' });
                }
            }
        } else {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
        setIsSharing(false);
    };

    const copyToClipboard = () => {
        if (!referralLink) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate referral link.' });
            return;
        }
        navigator.clipboard.writeText(referralLink).then(() => {
            toast({ title: 'Link Copied!' });
        }).catch(() => {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not copy link.' });
        });
    };

    return (
        <div className="container mx-auto p-4 space-y-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2"><Trophy className="h-8 w-8 text-yellow-500" /> Refer &amp; Earn</h1>
                <p className="text-muted-foreground">Invite friends and earn rewards!</p>
            </div>

            <Card className="bg-gradient-to-br from-primary/20 to-background">
                <CardHeader>
                    <CardTitle>Your Referral Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-center">
                     <div className="p-4 bg-card rounded-lg">
                        {referralsLoading ? <Loader className="mx-auto animate-spin" /> : <p className="text-3xl font-bold">{referralCount}</p>}
                        <p className="text-sm text-muted-foreground">Friends Joined</p>
                    </div>
                    <div className="p-4 bg-card rounded-lg">
                        {pointsLoading ? <Loader className="mx-auto animate-spin" /> : <p className="text-3xl font-bold">{pointsEarned}</p>}
                        <p className="text-sm text-muted-foreground">Points Earned</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Share Your Link</CardTitle>
                    <CardDescription className="block">Share your unique link with friends. You get 10 points and they get 5 points when they join!</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {referralLink ? (
                      <div className="flex items-center gap-2 p-3 border rounded-md bg-muted overflow-hidden">
                          <p className="text-sm font-mono text-muted-foreground flex-1 truncate">{referralLink}</p>
                          <Button variant="ghost" size="icon" onClick={copyToClipboard} className="shrink-0"><Copy className="h-4 w-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex justify-center p-3"><Loader className="animate-spin" /></div>
                    )}
                    <Button onClick={handleShare} className="w-full" disabled={isSharing || settingsLoading || !referralLink}>
                        {isSharing || settingsLoading ? <Loader className="animate-spin" /> : <Share2 className="mr-2" />}
                        Share via WhatsApp &amp; More
                    </Button>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift className="text-primary"/>Rewards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                   <p className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-green-500"/> <span className="font-bold">1 friend joins</span> = You get 10 Points, they get 5 Points</p>
                   <p className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-green-500"/> <span className="font-bold">200 Points</span> = 1 Free Test Series</p>
                   {user && <RedeemDialog userPoints={pointsEarned} userId={user.uid} />}
                </CardContent>
            </Card>
        </div>
    );
}
