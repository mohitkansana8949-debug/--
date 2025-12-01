
'use client';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Search, Youtube, Tv } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';

const QUICKLY_STUDY_CHANNEL_ID = 'UCF2s8P3t1-x9-g_X0d-jC-g';
const QUICKLY_STUDY_CHANNEL_URL = 'https://youtube.com/@quicklystudy01?si=4ykCGYaWGcvuISbh';


export default function YouTubeExplorerPage() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300).toLowerCase();

  // Fetch the specific document for the Quickly Study channel
  const channelDocRef = useMemoFirebase(() => (
    firestore ? doc(firestore, 'youtubeChannels', QUICKLY_STUDY_CHANNEL_ID) : null
  ), [firestore]);
  
  const { data: channelData, isLoading: channelLoading } = useDoc(channelDocRef);

  const allVideos = useMemo(() => channelData?.videos || [], [channelData]);

  const searchResults = useMemo(() => 
    debouncedSearchQuery
      ? allVideos.filter((video: any) => video.title.toLowerCase().includes(debouncedSearchQuery))
      : allVideos, // Show all videos if search is empty
    [debouncedSearchQuery, allVideos]
  );
    
  const isLoading = channelLoading;
  const noVideosExistInDb = !isLoading && allVideos.length === 0;
  const noSearchResults = !isLoading && debouncedSearchQuery && searchResults.length === 0;


  return (
    <div className="container mx-auto p-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center">
            <Youtube className="mr-3 h-8 w-8 text-red-500" />
            Quickly Study on YouTube
        </h1>
        <p className="text-muted-foreground">
          Explore educational videos from our channel, loaded directly from our database.
        </p>
      </div>
      
      {channelData && (
          <Card className="overflow-hidden bg-muted/50">
            <div className="flex flex-col md:flex-row items-center gap-4 p-4">
                <Image
                src={channelData.thumbnailUrl}
                alt={channelData.title}
                width={88}
                height={88}
                className="rounded-full border-4 border-background"
                />
                <div className="text-center md:text-left">
                <CardTitle>{channelData.title}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">{channelData.description}</CardDescription>
                </div>
                <a href={QUICKLY_STUDY_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="md:ml-auto">
                    <Button>View on YouTube</Button>
                </a>
            </div>
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
         {isLoading ? (
            <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>
         ) : (noVideosExistInDb || noSearchResults) ? (
            <div className="text-center text-muted-foreground mt-16 border rounded-lg p-8">
              <Tv className="mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">Video nahi dik raha hai</h3>
              {noSearchResults && <p>Your search did not match any videos. Try clearing your search.</p>}
              {noVideosExistInDb && <p>No videos have been synced from the admin panel yet.</p>}
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
