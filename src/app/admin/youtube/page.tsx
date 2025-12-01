
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, RefreshCw, Youtube } from 'lucide-react';
import { youtubeSyncFlow } from '@/ai/flows/youtube-search-flow';
import { useFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const NEW_CHANNEL_ID = 'UCbZWBEpqXUViu5P3rFRMmGg';

export default function ManageYoutubePage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [channelId, setChannelId] = useState(NEW_CHANNEL_ID);
    const [isSyncing, setIsSyncing] = useState(false);
    
    const handleSync = async () => {
        if (!channelId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a YouTube Channel ID.'});
            return;
        }
        if (!firestore) {
             toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.'});
            return;
        }

        setIsSyncing(true);

        try {
            const result = await youtubeSyncFlow({ channelId });

            // The document ID will be the channel ID for easy retrieval
            const channelDocRef = doc(firestore, 'youtubeChannels', result.channel.id);

            // Save all channel info and video metadata to a single document
            await setDoc(channelDocRef, {
                ...result.channel,
                videos: result.videos, // Array of all video objects
                lastSynced: serverTimestamp(),
            }, { merge: true });

            toast({ title: 'Sync Successful!', description: `Synced ${result.videos.length} videos from "${result.channel.title}".`});

        } catch (error: any) {
            console.error("YouTube Sync Error:", error);
            toast({ variant: 'destructive', title: 'Sync Failed', description: error.message || 'An unknown error occurred.'});
        } finally {
            setIsSyncing(false);
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage YouTube Content</CardTitle>
                <CardDescription>
                    Sync all videos from a YouTube channel to Firestore. This allows the app to display videos
                    without using API quota on every page load. This is a one-time operation per update.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="channelId">YouTube Channel ID</Label>
                    <Input id="channelId" value={channelId} onChange={(e) => setChannelId(e.target.value)} />
                </div>
                 <Button onClick={handleSync} disabled={isSyncing} className="w-full">
                    {isSyncing ? (
                        <><Loader className="mr-2 h-4 w-4 animate-spin"/> Syncing...</>
                    ) : (
                        <><RefreshCw className="mr-2 h-4 w-4"/> Sync All Channel Videos to Firestore</>
                    )}
                </Button>
                <Button asChild className="w-full mt-2" variant="secondary">
                    <Link href="/youtube" target="_blank">
                        <Youtube className="mr-2 h-4 w-4"/>
                        View YouTube Page
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
