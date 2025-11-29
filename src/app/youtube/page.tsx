'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { youtubeSearchFlow, type SearchInput, type SearchOutput } from '@/ai/flows/youtube-search-flow';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, Video, Youtube, Tv } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type SavedChannel = {
  channelId: string;
  title: string;
  thumbnailUrl: string;
};

const DEFAULT_CHANNELS: SavedChannel[] = [
    {
        channelId: 'UCY_25Yg1zIX1bVayr4Mh4FA',
        title: 'Quickly Study',
        thumbnailUrl: 'https://yt3.ggpht.com/h5G-237G2DQx-sZ-bS0GAvTTb9I_4a5KNP5-oN2B2I8-5hMXQ-w1L3fnrWk86xRPAeS3Y_R7=s176-c-k-c0x00ffffff-no-rj'
    }
];

export default function YouTubeExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchOutput['channels'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedChannels] = useLocalStorage<SavedChannel[]>('saved-yt-channels', DEFAULT_CHANNELS);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
        setSearchResults(null); // Clear search results if query is empty
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const results = await youtubeSearchFlow({ query: searchQuery, channelId: null });
        const savedChannelIds = new Set(savedChannels.map(c => c.channelId));
        // Filter search results to only include channels that are already saved
        const filteredChannels = results.channels.filter(channel => savedChannelIds.has(channel.channelId));
        setSearchResults(filteredChannels);
        if (filteredChannels.length === 0) {
            toast({ variant: 'default', title: 'No saved channels found for your search.'});
        }
    } catch (err: any) {
        setError(err.message || 'An error occurred while searching.');
        toast({ variant: 'destructive', title: 'Search Error', description: err.message });
    } finally {
        setIsLoading(false);
    }
  };
  
  const displayedChannels = searchResults !== null ? searchResults : savedChannels;


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

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search within saved channels..."
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader className="animate-spin" /> : <Search />}
        </Button>
      </form>
      
      {error && <p className="text-destructive text-center">{error}</p>}
      
      {isLoading && !searchResults && (
         <div className="flex justify-center mt-8">
          <Loader className="animate-spin h-10 w-10" />
        </div>
      )}

      {displayedChannels.length > 0 ? (
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
      ) : !isLoading && (
        <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
            <Tv className="mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No Channels Found</h3>
            <p>Your search did not match any saved channels. Try a different search or clear it to see all saved channels.</p>
        </div>
      )}

    </div>
  );
}
