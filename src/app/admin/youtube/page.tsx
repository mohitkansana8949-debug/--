
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader, RefreshCw, Youtube, Trash2, PlusCircle } from 'lucide-react';
import { youtubeSyncFlow } from '@/ai/flows/youtube-search-flow';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, deleteDoc } from 'firebase/firestore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';

export default function ManageYoutubePage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [newChannelId, setNewChannelId] = useState('');
    const [isSyncing, setIsSyncing] = useState<string | null>(null);

    const channelsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'youtubeChannels') : null), [firestore]);
    const { data: channels, isLoading } = useCollection(channelsQuery);

    const handleSync = async (channelId: string) => {
        if (!channelId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a YouTube Channel ID.'});
            return;
        }
        if (!firestore) {
             toast({ variant: 'destructive', title: 'Error', description: 'Firestore is not available.'});
            return;
        }

        setIsSyncing(channelId);

        try {
            const result = await youtubeSyncFlow({ channelId });

            const channelDocRef = doc(firestore, 'youtubeChannels', result.channel.id);

            await setDoc(channelDocRef, {
                ...result.channel,
                videos: result.videos,
                lastSynced: serverTimestamp(),
            }, { merge: true });

            toast({ title: 'Sync Successful!', description: `Synced ${result.videos.length} videos from "${result.channel.title}".`});
            setNewChannelId('');

        } catch (error: any) {
            console.error("YouTube Sync Error:", error);
            toast({ variant: 'destructive', title: 'Sync Failed', description: error.message || 'An unknown error occurred.'});
        } finally {
            setIsSyncing(null);
        }
    }
    
    const handleDelete = async (channelId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'youtubeChannels', channelId));
            toast({ title: "Success", description: "Channel removed successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to remove channel." });
            console.error("Error removing channel:", error);
        }
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Add New YouTube Channel</CardTitle>
                    <CardDescription>
                        Add a new YouTube channel by its ID to sync its videos to Firestore.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="channelId">YouTube Channel ID</Label>
                        <div className="flex gap-2">
                             <Input id="channelId" value={newChannelId} onChange={(e) => setNewChannelId(e.target.value)} placeholder="e.g., UCRd08jUfc7IIvD6nwLPWfhA" />
                             <Button onClick={() => handleSync(newChannelId)} disabled={!!isSyncing || !newChannelId}>
                                {isSyncing === newChannelId ? (
                                    <><Loader className="mr-2 h-4 w-4 animate-spin"/> Syncing...</>
                                ) : (
                                    <><PlusCircle className="mr-2 h-4 w-4"/> Add & Sync Channel</>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Synced Channels</CardTitle>
                    <CardDescription>Manage and re-sync your existing YouTube channels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>
                    ) : channels && channels.length > 0 ? (
                        channels.map(channel => (
                            <Card key={channel.id} className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4">
                                <div className="flex items-center gap-4">
                                    <Image src={channel.thumbnailUrl} alt={channel.title} width={48} height={48} className="rounded-full" />
                                    <div>
                                        <p className="font-semibold">{channel.title}</p>
                                        <p className="text-xs text-muted-foreground">{channel.videos?.length || 0} videos synced</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button onClick={() => handleSync(channel.id)} variant="outline" size="sm" disabled={!!isSyncing}>
                                        {isSyncing === channel.id ? <Loader className="animate-spin"/> : <RefreshCw className="h-4 w-4"/>}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm" disabled={!!isSyncing}><Trash2 className="h-4 w-4"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently remove the channel and its videos from the app.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(channel.id)}>Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </Card>
                        ))
                    ) : (
                         <div className="text-center text-muted-foreground p-8">
                            <Youtube className="mx-auto h-12 w-12"/>
                            <p className="mt-4">No channels have been synced yet.</p>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
