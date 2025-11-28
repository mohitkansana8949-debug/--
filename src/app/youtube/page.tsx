
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { youtubeSearchFlow, type SearchInput, type SearchOutput } from '@/ai/flows/youtube-search-flow';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, Video, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedChannels] = useLocalStorage<SavedChannel[]>('saved-yt-channels', DEFAULT_CHANNELS);

  const fetchVideosFromSavedChannels = useCallback(async (query: string = '') => {
    setIsLoading(true);
    setError(null);
    try {
        let allVideos: SearchOutput['videos'] = [];

        // To search in all channels, we can't just pass channel IDs to the search API.
        // We need to construct a query that is likely to return results from our channels.
        // A simple way is to search for the query within each channel's context.
        // For default view, we'll just search for a generic term within the main channel.
        const effectiveQuery = query || 'UPSC GS'; // A generic but relevant default query
        
        const results = await youtubeSearchFlow({ query: effectiveQuery });

        const savedChannelIds = new Set(savedChannels.map(c => c.channelId));
        
        // Filter videos to only include those from saved channels
        const filteredVideos = results.videos.filter(video => savedChannelIds.has(video.channelId));
        
        setSearchResults({ channels: [], videos: filteredVideos });

    } catch (err: any) {
        setError(err.message || 'An error occurred while fetching videos.');
    } finally {
        setIsLoading(false);
    }
  }, [savedChannels]);


  useEffect(() => {
    // Initial load: Fetch videos from saved channels with a default term
    fetchVideosFromSavedChannels();
  }, [fetchVideosFromSavedChannels]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
        // If search is cleared, fetch default videos again
        fetchVideosFromSavedChannels();
        return;
    };
    // When searching, use the user's query
    fetchVideosFromSavedChannels(searchQuery);
  };


  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
            <Youtube className="mr-3 h-8 w-8 text-red-500" />
            YouTube Videos
        </h1>
        <p className="text-muted-foreground">
          Watch videos from our selected channels.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for videos from our channels..."
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader className="animate-spin" /> : <Search />}
        </Button>
      </form>
      
      {error && <p className="text-destructive text-center">{error}</p>}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <Loader className="animate-spin h-10 w-10" />
        </div>
      )}

      {searchResults && (
        <div className="space-y-8">
            {searchResults.videos && searchResults.videos.length > 0 ? (
                <div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {searchResults.videos.map(video => (
                            <Link href={`/courses/watch/${video.videoId}?chatId=${video.channelId}`} key={video.videoId}>
                                <Card className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col h-full">
                                    <div className="relative w-full aspect-video">
                                         <Image 
                                            src={video.thumbnailUrl} 
                                            alt={video.title} 
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-base line-clamp-2 h-12">{video.title}</CardTitle>
                                        <CardDescription className="line-clamp-1 text-xs">{video.channelTitle}</CardDescription>
                                    </CardHeader>
                                </Card>
                             </Link>
                        ))}
                    </div>
                </div>
            ) : !isLoading && (
                 <div className="text-center text-muted-foreground mt-16">
                    <p>No videos found. Try a different search.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
