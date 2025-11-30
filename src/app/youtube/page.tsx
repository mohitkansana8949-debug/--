'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, Youtube, Tv, UserSquare2 } from 'lucide-react';
import { youtubeSearchFlow } from '@/ai/flows/youtube-search-flow';
import type { SearchOutput } from '@/ai/flows/youtube-search-flow';
import Image from 'next/image';
import Link from 'next/link';

const QUICKLY_STUDY_CHANNEL = {
  channelId: 'UCF2s8P3t1-x9-g_X0d-jC-g',
  title: 'Quickly Study',
  description: 'The quickest way to study for competitive exams.',
  thumbnailUrl: 'https://yt3.ggpht.com/g-qu-yW38j2J9_Z8zMOPx3DF3nE3zMvA_a2zKbC1A9h3J8JCaR8E3g_D-MvJz_c_hJzYQ5g=s176-c-k-c0x00ffffff-no-rj',
};


export default function YouTubeExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<SearchOutput['videos']>([]);
  const [channels, setChannels] = useState<SearchOutput['channels']>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
        // Clear previous search results if query is empty
        setVideos([]);
        setChannels([]);
        return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const results = await youtubeSearchFlow({ 
        query: searchQuery,
        channelId: null
      });
      setVideos(results.videos);
      setChannels(results.channels);
    } catch (err: any) {
      setError(err.message || "Failed to fetch videos.");
      console.error(err);
    } finally {
      setIsSearching(false);
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
              disabled={isSearching}
            />
        </div>
        <Button type="submit" disabled={isSearching}>
            {isSearching ? <Loader className="animate-spin" /> : <Search />}
        </Button>
      </form>
      
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center"><UserSquare2 className="mr-2"/> Our Channel</h2>
          <Link href={`/youtube/${QUICKLY_STUDY_CHANNEL.channelId}`} key={QUICKLY_STUDY_CHANNEL.channelId}>
              <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors bg-gradient-to-r from-primary/10 via-background to-background">
                <Image src={QUICKLY_STUDY_CHANNEL.thumbnailUrl} alt={QUICKLY_STUDY_CHANNEL.title} width={80} height={80} className="rounded-full border-2 border-primary" />
                <div className="flex-1">
                    <p className="font-bold text-lg">{QUICKLY_STUDY_CHANNEL.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{QUICKLY_STUDY_CHANNEL.description}</p>
                </div>
            </Card>
        </Link>
        </div>
        
        {isSearching && (
            <div className="flex justify-center mt-8">
                <Loader className="animate-spin h-8 w-8" />
            </div>
        )}

        {error && <p className="text-destructive text-center">{error}</p>}

        {!isSearching && (videos.length > 0 || channels.length > 0) && (
             <div className="space-y-6">
                {channels.length > 0 && (
                     <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center"><UserSquare2 className="mr-2"/> Channels</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {channels.map(channel => (
                                <Link href={`/youtube/${channel.channelId}`} key={channel.channelId}>
                                    <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors h-full">
                                        <Image src={channel.thumbnailUrl} alt={channel.title} width={60} height={60} className="rounded-full" />
                                        <div className="flex-1">
                                            <p className="font-semibold">{channel.title}</p>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{channel.description}</p>
                                        </div>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
                {videos.length > 0 && (
                    <div>
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
            </div>
        )}
        
        {!isSearching && !error && videos.length === 0 && channels.length > 0 && searchQuery.trim() && (
            <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
              <Tv className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No Videos Found</h3>
              <p>Your search did not return any videos. Please try a different query.</p>
            </div>
        )}
      </div>
    </div>
  );
}
