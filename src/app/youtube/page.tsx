
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, Youtube, Tv } from 'lucide-react';
import { youtubeSearchFlow } from '@/ai/flows/youtube-search-flow';
import type { SearchOutput } from '@/ai/flows/youtube-search-flow';
import Image from 'next/image';
import Link from 'next/link';

export default function YouTubeExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('Sainik School, Military School, Navodaya Vidyalaya');
  const [videos, setVideos] = useState<SearchOutput['videos']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initially load videos with the default query
    handleSearch();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const results = await youtubeSearchFlow({ 
        query: searchQuery || 'Sainik School, Military School, Navodaya Vidyalaya',
      });
      setVideos(results.videos);
    } catch (err: any) {
      setError(err.message || "Failed to fetch videos.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
            <Youtube className="mr-3 h-8 w-8 text-red-500" />
            YouTube Explorer
        </h1>
        <p className="text-muted-foreground">
          Explore educational videos from across YouTube.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for any topic on YouTube..."
              className="flex-grow pl-10"
              disabled={isLoading}
            />
        </div>
        <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader className="animate-spin" /> : <Search />}
        </Button>
      </form>
      
      {isLoading ? (
        <div className="flex justify-center mt-8">
          <Loader className="animate-spin h-10 w-10" />
        </div>
      ) : error ? (
        <p className="text-destructive text-center">{error}</p>
      ) : videos.length > 0 ? (
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
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
          <Tv className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No Videos Found</h3>
          <p>Your search did not return any results. Please try a different query.</p>
        </div>
      )}
    </div>
  );
}
