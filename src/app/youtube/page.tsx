'use client';
import { useState } from 'react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, Tv, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type SavedChannel = {
  channelId: string;
  title: string;
  thumbnailUrl: string;
};

export default function YouTubeExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [savedChannels] = useLocalStorage<SavedChannel[]>('saved-yt-channels', []);
  
  const displayedChannels = savedChannels.filter(channel => 
    channel.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
            <Youtube className="mr-3 h-8 w-8 text-red-500" />
            YouTube Channels
        </h1>
        <p className="text-muted-foreground">
          Browse videos from our selected channels.
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within saved channels..."
            className="flex-grow pl-10"
            />
        </div>
      </form>
      
      {savedChannels.length > 0 ? (
        displayedChannels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedChannels.map(channel => (
                    <Link href={`/youtube/${channel.channelId}`} key={channel.channelId}>
                        <Card className="h-full group transition-shadow hover:shadow-lg">
                            <CardContent className="p-4 flex flex-col items-center text-center gap-4">
                                <Image src={channel.thumbnailUrl} alt={channel.title} width={88} height={88} className="rounded-full border-2 border-transparent group-hover:border-primary transition-all" />
                                <div>
                                    <p className="font-bold group-hover:text-primary">{channel.title}</p>
                                    {channel.subscriberCount && <p className="text-xs text-muted-foreground">{parseInt(channel.subscriberCount).toLocaleString()} subscribers</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        ) : (
            <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
                <Tv className="mx-auto h-12 w-12" />
                <h3 className="mt-4 text-lg font-semibold">No Channels Found</h3>
                <p>Your search did not match any saved channels. Try a different search.</p>
            </div>
        )
      ) : (
        <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
            <Tv className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No Channels Added</h3>
            <p>The admin has not added any YouTube channels yet.</p>
        </div>
      )}

    </div>
  );
}
