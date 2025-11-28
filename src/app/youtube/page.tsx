
'use client';

import { useState, FormEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Search, Youtube as YoutubeIcon, UserPlus, CheckCircle, Video } from 'lucide-react';
import Image from 'next/image';
import { searchChannels, searchVideos, type YouTubeChannel, type YouTubeVideo } from '@/ai/flows/youtube-search-flow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

export default function YouTubePage() {
  const [query, setQuery] = useState('');
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [myChannels, setMyChannels] = useLocalStorage<YouTubeChannel[]>('my-youtube-channels', []);
  
  const myChannelIds = new Set(myChannels.map(c => c.id));

  const handleSearch = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setChannels([]);
    setVideos([]);
    try {
      const [channelResults, videoResults] = await Promise.all([
        searchChannels({ query }),
        searchVideos({ query })
      ]);
      setChannels(channelResults);
      setVideos(videoResults);
    } catch (error) {
      console.error('Error searching YouTube:', error);
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
            Search for educational channels and videos.
            </p>
        </div>

      <Tabs defaultValue="search">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="my-channels">My Channels ({myChannels.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="search" className="mt-6">
            <form onSubmit={handleSearch} className="mb-8 flex max-w-2xl mx-auto gap-2">
                <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for 'Quickly Study', 'Sainik School'..."
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
            
            {!isLoading && channels.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">Channels</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {channels.map((channel) => (
                             <Card key={channel.id} className="flex flex-col items-center text-center p-3">
                                 <Link href={`/youtube/channel/${channel.id}`} className="flex flex-col items-center gap-2 w-full">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={channel.thumbnailUrl} alt={channel.title} />
                                        <AvatarFallback>{channel.title.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-semibold text-sm line-clamp-2">{channel.title}</p>
                                 </Link>
                                  {myChannelIds.has(channel.id) ? (
                                    <Button variant="secondary" disabled className="w-full mt-2 text-xs h-8">
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Added
                                    </Button>
                                ) : (
                                    <Button onClick={() => handleAddChannel(channel)} className="w-full mt-2 text-xs h-8">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add Channel
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}
            
            {!isLoading && videos.length > 0 && (
                 <div>
                    <h2 className="text-2xl font-bold mb-4">Videos</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {videos.map((video) => (
                        <Link href={`/youtube/${video.id}`} key={video.id}>
                            <Card
                                className="overflow-hidden cursor-pointer transition-transform hover:scale-105 hover:shadow-lg h-full"
                            >
                                <div className="aspect-video relative">
                                <Image
                                    src={video.thumbnailUrl}
                                    alt={video.title}
                                    layout="fill"
                                    objectFit="cover"
                                />
                                </div>
                                <CardContent className="p-4">
                                <h3 className="font-semibold text-base line-clamp-2">{video.title}</h3>
                                <p className="text-muted-foreground text-sm mt-1">{video.channelTitle}</p>
                                </CardContent>
                            </Card>
                        </Link>
                        ))}
                    </div>
                </div>
            )}

            {!isLoading && channels.length === 0 && videos.length === 0 && (
                 <div className="text-center text-muted-foreground py-16">
                    <p>No results found. Try a different search.</p>
                </div>
            )}

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
                                    <p className="text-xs text-muted-foreground mt-1">{channel.subscriberCount} subscribers</p>
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

