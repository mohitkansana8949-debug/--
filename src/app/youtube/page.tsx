
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, Youtube, Tv, UserSquare2 } from 'lucide-react';
import { youtubeSearchFlow, getHomePageVideos } from '@/ai/flows/youtube-search-flow';
import type { SearchOutput } from '@/ai/flows/youtube-search-flow';
import Image from 'next/image';
import Link from 'next/link';

export default function YouTubeExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<SearchOutput['videos']>([]);
  const [channels, setChannels] = useState<SearchOutput['channels']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [quicklyStudyChannel, setQuicklyStudyChannel] = useState<SearchOutput['channels'][0] | null>(null);

  useEffect(() => {
    handleInitialLoad();
  }, []);

  const handleInitialLoad = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const results = await getHomePageVideos({});
      const otherEducationalVideos = results.otherVideos;
      
      // Find and set the Quickly Study channel to be featured
      const qsChannelDetails = await youtubeSearchFlow({ query: 'Quickly Study', channelId: null });
      if (qsChannelDetails.channels.length > 0) {
        setQuicklyStudyChannel(qsChannelDetails.channels[0]);
      }

      setVideos(otherEducationalVideos);
      setChannels([]); // Clear channels on initial load
    } catch (err: any) {
      setError(err.message || "Failed to fetch initial videos.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) {
      handleInitialLoad();
      return;
    }

    setIsLoading(true);
    setError(null);
    setQuicklyStudyChannel(null); // Hide featured channel during search
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
      ) : (
        <div className="space-y-8">
            {quicklyStudyChannel && (
                 <div className="space-y-4">
                     <h2 className="text-xl font-bold flex items-center"><UserSquare2 className="mr-2"/> Our Channel</h2>
                     <Link href={`/youtube/${quicklyStudyChannel.channelId}`} key={quicklyStudyChannel.channelId}>
                         <Card className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors bg-gradient-to-r from-primary/10 via-background to-background">
                            <Image src={quicklyStudyChannel.thumbnailUrl} alt={quicklyStudyChannel.title} width={80} height={80} className="rounded-full border-2 border-primary" />
                            <div className="flex-1">
                                <p className="font-bold text-lg">{quicklyStudyChannel.title}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">{quicklyStudyChannel.description}</p>
                            </div>
                        </Card>
                    </Link>
                 </div>
            )}
            
            {(videos.length > 0 || channels.length > 0) && (
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
            
            {(!isLoading && !error && videos.length === 0 && channels.length === 0 && !quicklyStudyChannel) && (
                <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
                  <Tv className="mx-auto h-12 w-12" />
                  <h3 className="mt-4 text-lg font-semibold">No Videos Found</h3>
                  <p>Your search did not return any results. Please try a different query.</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
