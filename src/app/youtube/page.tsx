
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

const QUICKLY_STUDY_CHANNEL_ID = 'UCF2s8P3t1-x9-g_X0d-jC-g';

const categories = ["Sainik School", "Military School", "Maths", "GK"];

export default function YouTubeExplorerPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300).toLowerCase();

  const channelsQuery = useMemoFirebase(() => (
    firestore ? collection(firestore, 'youtubeChannels') : null
  ), [firestore]);

  const { data: channels, isLoading: channelsLoading } = useCollection(channelsQuery);
  
  const quicklyStudyChannel = useMemo(() => {
      if (channels && channels.length > 0) {
          return channels.find(c => c.id === QUICKLY_STUDY_CHANNEL_ID);
      }
      return null;
  }, [channels]);

  const allVideos = useMemo(() => quicklyStudyChannel?.videos || [], [quicklyStudyChannel]);


  const searchResults = useMemo(() => 
    debouncedSearchQuery
      ? allVideos.filter((video: any) => video.title.toLowerCase().includes(debouncedSearchQuery))
      : [],
    [debouncedSearchQuery, allVideos]
  );
    
  const categorizedVideos = useMemo(() => 
    categories.map(category => ({
      category,
      videos: allVideos.filter((video: any) => video.title.toLowerCase().includes(category.toLowerCase())).slice(0, 4)
    })), [allVideos]
  );

  const isLoading = channelsLoading && !quicklyStudyChannel;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
            <Youtube className="mr-3 h-8 w-8 text-red-500" />
            Quickly Study on YouTube
        </h1>
        <p className="text-muted-foreground">
          Explore educational videos from our channel.
        </p>
      </div>
      
      {isLoading ? <div className="flex h-32 items-center justify-center"><Loader className="animate-spin" /></div> : quicklyStudyChannel ? (
          <Card className="overflow-hidden bg-muted/50">
            <div className="flex flex-col md:flex-row items-center gap-4 p-4">
                <Image
                src={quicklyStudyChannel.thumbnailUrl}
                alt={quicklyStudyChannel.title}
                width={88}
                height={88}
                className="rounded-full border-4 border-background"
                />
                <div className="text-center md:text-left">
                <CardTitle>{quicklyStudyChannel.title}</CardTitle>
                <CardDescription className="mt-1">{quicklyStudyChannel.description}</CardDescription>
                </div>
                <a href={`https://www.youtube.com/channel/${quicklyStudyChannel.id}`} target="_blank" rel="noopener noreferrer" className="md:ml-auto">
                    <Button>View Channel</Button>
                </a>
            </div>
          </Card>
      ): (
        <Card className="text-center p-8">
            <CardTitle>Channel Not Synced</CardTitle>
            <CardDescription>The YouTube channel has not been synced yet. Please go to the admin panel to sync it.</CardDescription>
            <Button asChild className="mt-4"><Link href="/admin/youtube">Go to Admin Panel</Link></Button>
        </Card>
      )}


      <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for videos within our channel..."
            className="flex-grow pl-10"
          />
      </div>
      
      <div className="space-y-8">
        {debouncedSearchQuery ? (
          // Search Results View
          <div>
            <h2 className="text-2xl font-bold mb-4">Search Results for "{debouncedSearchQuery}"</h2>
            {searchResults.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults.map((video: any) => (
                        <Link href={`/courses/watch/${video.videoId}?chatId=${QUICKLY_STUDY_CHANNEL_ID}`} key={video.videoId}>
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
            ) : (
                <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
                  <Tv className="mx-auto h-12 w-12" />
                  <h3 className="mt-4 text-lg font-semibold">No Videos Found</h3>
                  <p>Your search did not match any videos from our channel.</p>
                </div>
            )}
          </div>
        ) : (
          // Default Categorized View
          <div className="space-y-8">
            {categorizedVideos.map(({category, videos}) => (
              videos.length > 0 && (
                <div key={category}>
                  <h2 className="text-2xl font-bold mb-4">{category}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {videos.map((video: any) => (
                        <Link href={`/courses/watch/${video.videoId}?chatId=${QUICKLY_STUDY_CHANNEL_ID}`} key={video.videoId}>
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
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
