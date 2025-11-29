'use client';

import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader, PlusCircle, Trash2 } from 'lucide-react';
import { youtubeSearchFlow } from '@/ai/flows/youtube-search-flow';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export type SavedChannel = {
  channelId: string;
  title: string;
  thumbnailUrl: string;
};

export default function ManageYoutubePage() {
    const [savedChannels, setSavedChannels] = useLocalStorage<SavedChannel[]>('saved-yt-channels', []);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAddChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            toast({ variant: 'destructive', title: 'Invalid URL or Name' });
            return;
        }

        setIsLoading(true);
        try {
            const results = await youtubeSearchFlow({ query: searchQuery, channelId: null });
            if (results.channels && results.channels.length > 0) {
                const channelToAdd = results.channels[0];
                if (savedChannels.some(c => c.channelId === channelToAdd.channelId)) {
                    toast({ variant: 'destructive', title: 'Channel Already Exists' });
                } else {
                    setSavedChannels([...savedChannels, channelToAdd]);
                    toast({ title: 'Success', description: `${channelToAdd.title} has been added.` });
                    setSearchQuery('');
                }
            } else {
                toast({ variant: 'destructive', title: 'Channel Not Found' });
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not add channel.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRemoveChannel = (channelIdToRemove: string) => {
        setSavedChannels(savedChannels.filter(c => c.channelId !== channelIdToRemove));
        toast({ title: 'Channel Removed' });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage YouTube Channels</CardTitle>
                <CardDescription>Add or remove YouTube channels whose videos will be visible in the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                 <form onSubmit={handleAddChannel} className="space-y-4">
                    <Input 
                        placeholder="Enter channel name or URL to search and add..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Search & Add Channel
                    </Button>
                </form>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Saved Channels</h3>
                     {savedChannels.length === 0 ? (
                        <p className="text-muted-foreground text-center p-4">No channels have been added yet.</p>
                     ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedChannels.map(channel => (
                            <Card key={channel.channelId} className="p-4 flex items-center gap-4">
                               <Image src={channel.thumbnailUrl} alt={channel.title} width={48} height={48} className="rounded-full" />
                               <div className="flex-1">
                                 <p className="font-semibold line-clamp-1">{channel.title}</p>
                                 <p className="text-xs text-muted-foreground">{channel.channelId}</p>
                               </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveChannel(channel.channelId)}>
                                    <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                            </Card>
                        ))}
                        </div>
                     )}
                </div>
            </CardContent>
        </Card>
    );
}
