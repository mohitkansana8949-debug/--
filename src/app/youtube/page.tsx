
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, Youtube, Tv } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function YouTubeExplorerPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const debouncedSearchQuery = useDebounce(searchQuery, 300).toLowerCase();

  const channelsQuery = useMemoFirebase(() => (
    firestore ? collection(firestore, 'youtubeChannels') : null
  ), [firestore]);
  
  const { data: channelsData, isLoading: channelsLoading } = useCollection(channelsQuery);

  const allVideos = useMemo(() => {
      if (!channelsData) return [];
      if (selectedChannel === 'all') {
          return channelsData.flatMap(channel => channel.videos || []);
      }
      const channel = channelsData.find(c => c.id === selectedChannel);
      return channel?.videos || [];
  }, [channelsData, selectedChannel]);

  const searchResults = useMemo(() => 
    debouncedSearchQuery
      ? allVideos.filter((video: any) => video.title.toLowerCase().includes(debouncedSearchQuery))
      : allVideos,
    [debouncedSearchQuery, allVideos]
  );
    
  const isLoading = channelsLoading;
  const noChannelsExist = !isLoading && (!channelsData || channelsData.length === 0);
  const noVideosInFilter = !isLoading && !noChannelsExist && allVideos.length === 0;
  const noSearchResults = !isLoading && !!debouncedSearchQuery && searchResults.length === 0;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
            <Youtube className="mr-3 h-8 w-8 text-red-500" />
            YouTube Explorer
        </h1>
        <p className="text-muted-foreground">
          Explore educational videos from our synced channels.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for videos across all channels..."
                className="w-full pl-10"
            />
          </div>
          <Select onValueChange={setSelectedChannel} defaultValue="all" disabled={isLoading || noChannelsExist}>
                <SelectTrigger className="w-full md:w-[280px]">
                    <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    {channelsData?.map(channel => (
                        <SelectItem key={channel.id} value={channel.id}>{channel.title}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
      </div>
      
      <div className="space-y-8">
         {isLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>
         ) : (noChannelsExist || noSearchResults || noVideosInFilter) ? (
            <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
              <Tv className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">Video nahi dik raha hai</h3>
              {noSearchResults && <p>Your search did not match any videos. Try a different search term.</p>}
              {noChannelsExist && <p>No YouTube channels have been synced by the admin yet.</p>}
              {noVideosInFilter && !noChannelsExist && <p>This channel has no videos synced.</p>}
            </div>
         ) : searchResults.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map((video: any) => (
                    <Link href={`/courses/watch/${video.videoId}`} key={video.videoId}>
                     <Card className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col h-full group">
                        <div className="relative w-full aspect-video">
                            <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" />
                        </div>
                        <CardHeader className="p-3">
                            <CardTitle className="text-sm line-clamp-2 h-10 group-hover:text-primary">{video.title}</CardTitle>
                        </CardHeader>
                     </Card>
                    </Link>
                ))}
             </div>
        ) : null}
      </div>
    </div>
  );
}
