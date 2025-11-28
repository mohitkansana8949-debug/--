
'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { youtubeSearchFlow, type SearchInput, type SearchOutput } from '@/ai/flows/youtube-search-flow';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, UserPlus, Youtube, Video, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

type SavedChannel = {
  channelId: string;
  title: string;
  thumbnailUrl: string;
};

const DEFAULT_CHANNEL_ID = 'UCY_25Yg1zIX1bVayr4Mh4FA'; // Quickly Study channel ID

export default function YouTubeExplorerPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<SearchOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedChannels, setSavedChannels] = useLocalStorage<SavedChannel[]>('saved-yt-channels', []);

  useEffect(() => {
    const fetchDefaultVideos = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Using a known query that will return videos from the default channel
            const result = await youtubeSearchFlow({ query: 'Quickly Study #UPSC' });
            // Filter videos to only show those from the default channel
            const filteredResult = {
                ...result,
                videos: result.videos.filter(v => v.channelId === DEFAULT_CHANNEL_ID)
            };
            setSearchResults(filteredResult);
        } catch (err: any) {
            setError(err.message || 'An error occurred fetching default videos.');
        } finally {
            setIsLoading(false);
        }
    };
    fetchDefaultVideos();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearchResults(null);
    try {
      const results = await youtubeSearchFlow({ query: searchQuery });
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'An error occurred while searching.');
    } finally {
      setIsLoading(false);
    }
  };

  const isChannelSaved = (channelId: string) => {
    return savedChannels.some(c => c.channelId === channelId);
  }

  const toggleSaveChannel = (channel: { channelId: string; title: string; thumbnailUrl: string; }) => {
    if (isChannelSaved(channel.channelId)) {
      setSavedChannels(savedChannels.filter(c => c.channelId !== channel.channelId));
    } else {
      setSavedChannels([...savedChannels, channel]);
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
          Search for YouTube channels and videos.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for channels or videos..."
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
            {/* Channels Section */}
            {searchResults.channels && searchResults.channels.length > 0 && (
                 <div>
                    <h2 className="text-2xl font-bold mb-4">Channels</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {searchResults.channels.map(channel => (
                        <Card key={channel.channelId} className="flex flex-col items-center p-4 text-center">
                            <Image src={channel.thumbnailUrl} alt={channel.title} width={88} height={88} className="rounded-full mb-3" />
                            <CardTitle className="text-sm font-semibold line-clamp-2 mb-2 h-10">{channel.title}</CardTitle>
                             <Button 
                                variant={isChannelSaved(channel.channelId) ? 'success' : 'outline'} 
                                size="sm"
                                onClick={() => toggleSaveChannel(channel)}
                                className="w-full"
                            >
                                {isChannelSaved(channel.channelId) ? <CheckCircle className="mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4"/>}
                                {isChannelSaved(channel.channelId) ? 'Added' : 'Add Channel'}
                            </Button>
                        </Card>
                        ))}
                    </div>
                </div>
            )}
           
            {/* Videos Section */}
            {searchResults.videos && searchResults.videos.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Videos</h2>
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
            )}

             {!isLoading && searchResults.channels.length === 0 && searchResults.videos.length === 0 && (
                 <div className="text-center text-muted-foreground mt-16">
                    <p>No results found for "{searchQuery}".</p>
                </div>
            )}
        </div>
      )}
    </div>
  );
}
