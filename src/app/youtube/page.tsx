
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, Youtube, Tv } from 'lucide-react';
import { youtubeSearchFlow } from '@/ai/flows/youtube-search-flow';
import type { SearchOutput } from '@/ai/flows/youtube-search-flow';
import Image from 'next/image';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';

const QUICKLY_STUDY_CHANNEL = {
  channelId: 'UCF2s8P3t1-x9-g_X0d-jC-g',
  title: 'Quickly Study',
  description: 'The quickest way to study for competitive exams.',
  thumbnailUrl: 'https://yt3.ggpht.com/g-qu-yW38j2J9_Z8zMOPx3DF3nE3zMvA_a2zKbC1A9h3J8JCaR8E3g_D-MvJz_c_hJzYQ5g=s176-c-k-c0x00ffffff-no-rj',
};


export default function YouTubeExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<SearchOutput['videos']>([]);
  const [isSearching, setIsSearching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    // Fetch videos on component mount and when search query changes
    const fetchVideos = async () => {
        setIsSearching(true);
        setError(null);
        try {
          const results = await youtubeSearchFlow({ 
            query: debouncedSearchQuery,
          });
          setVideos(results.videos);
        } catch (err: any) {
          setError(err.message || "Failed to fetch videos.");
          console.error(err);
        } finally {
          setIsSearching(false);
        }
    };
    fetchVideos();
  }, [debouncedSearchQuery]);

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
            <Youtube className="mr-3 h-8 w-8 text-red-500" />
            Quickly Study Channel
        </h1>
        <p className="text-muted-foreground">
          Explore all educational videos from our channel.
        </p>
      </div>

      <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for videos within our channel..."
            className="flex-grow pl-10"
            disabled={isSearching}
          />
      </div>
      
      <div className="space-y-8">
        {isSearching && (
            <div className="flex justify-center mt-8">
                <Loader className="animate-spin h-8 w-8" />
            </div>
        )}

        {error && <p className="text-destructive text-center">{error}</p>}

        {!isSearching && videos.length > 0 && (
             <div className="space-y-6">
                 <h2 className="text-xl font-bold mb-4 flex items-center"><Tv className="mr-2"/> Videos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {videos.map(video => (
                    <Link href={`/courses/watch/${video.videoId}?chatId=${video.channelId}`} key={video.videoId}>
                      <Card className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col h-full group">
                        <div className="relative w-full aspect-video">
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardHeader>
                          <CardTitle className="text-base line-clamp-2 h-12 group-hover:text-primary">{video.title}</CardTitle>
                          <CardDescription className="text-xs">{video.channelTitle}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
            </div>
        )}
        
        {!isSearching && !error && videos.length === 0 && (
            <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
              <Tv className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No Videos Found</h3>
              <p>Your search for "{searchQuery}" did not return any videos from our channel.</p>
            </div>
        )}
      </div>
    </div>
  );
}
