'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Search, Youtube as YoutubeIcon, UserPlus, CheckCircle, Video } from 'lucide-react';
import Image from 'next/image';
import { searchChannels, type YouTubeChannel } from '@/ai/flows/youtube-search-flow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

function formatSubscriberCount(count: string): string {
    const num = parseInt(count, 10);
    if (isNaN(num)) return count;

    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

export default function YouTubePage() {
  const [query, setQuery] = useState('');
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [myChannels, setMyChannels] = useLocalStorage<YouTubeChannel[]>('my-youtube-channels', []);
  
  const myChannelIds = new Set(myChannels.map(c => c.id));

  const handleSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setChannels([]);
    try {
      const results = await searchChannels({ query });
      setChannels(results);
    } catch (error) {
      console.error('Error searching channels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChannel = (channel: YouTubeChannel) => {
      setMyChannels(prev => [...prev, channel]);
  }

  const handleRemoveChannel = (channelId: string) => {
      setMyChannels(prev => prev.filter(c => c.id !== channelId));
  }

  return (
    <div className="container mx-auto p-4">
        <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <YoutubeIcon className="h-10 w-10 text-red-500" />
            YouTube Explorer
            </h1>
            <p className="text-muted-foreground mt-2">
            Search for educational channels and save them to your library.
            </p>
        </div>

      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search Channels</TabsTrigger>
          <TabsTrigger value="my-channels">My Channels ({myChannels.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="mt-6">
            <form onSubmit={handleSearch} className="mb-8 flex max-w-2xl mx-auto gap-2">
                <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for channels like 'Quickly Study'..."
                className="flex-grow"
                />
                <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Search className="mr-2 h-4 w-4" />
                )}
                Search
                </Button>
            </form>

            {isLoading && (
                <div className="flex justify-center mt-8">
                <Loader className="h-12 w-12 animate-spin text-primary" />
                </div>
            )}
            
            <div className="space-y-4">
                {channels.map((channel) => (
                    <Card key={channel.id} className="flex items-center p-4 gap-4">
                         <Link href={`/youtube/channel/${channel.id}`} className="flex items-center gap-4 flex-grow">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={channel.thumbnailUrl} alt={channel.title} />
                                <AvatarFallback>{channel.title.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <h3 className="font-semibold text-lg">{channel.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{channel.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">{formatSubscriberCount(channel.subscriberCount)} subscribers</p>
                            </div>
                         </Link>
                         {myChannelIds.has(channel.id) ? (
                             <Button variant="secondary" disabled>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Added
                             </Button>
                         ) : (
                            <Button onClick={() => handleAddChannel(channel)}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Add Channel
                            </Button>
                         )}
                    </Card>
                ))}
            </div>

        </TabsContent>
        <TabsContent value="my-channels" className="mt-6">
            {myChannels.length === 0 ? (
                <div className="text-center text-muted-foreground py-16">
                    <p>You haven't added any channels yet.</p>
                    <p>Use the search tab to find and add channels.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {myChannels.map((channel) => (
                         <Card key={channel.id} className="flex items-center p-4 gap-4">
                            <Link href={`/youtube/channel/${channel.id}`} className="flex items-center gap-4 flex-grow">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={channel.thumbnailUrl} alt={channel.title} />
                                    <AvatarFallback>{channel.title.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <h3 className="font-semibold text-lg">{channel.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{formatSubscriberCount(channel.subscriberCount)} subscribers</p>
                                </div>
                            </Link>
                            <Button variant="destructive" onClick={() => handleRemoveChannel(channel.id)}>Remove</Button>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Custom hook for using localStorage
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue] as const;
}
