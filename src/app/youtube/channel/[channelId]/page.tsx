'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { searchVideos, type YouTubeVideo } from '@/ai/flows/youtube-search-flow';
import Link from 'next/link';

export default function ChannelVideosPage() {
  const { channelId } = useParams();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!channelId) return;

    const fetchChannelVideos = async () => {
      setIsLoading(true);
      try {
        // We use the searchVideos flow but only provide a channelId and an empty query
        // This effectively lists videos for that channel.
        const results = await searchVideos({ query: '', channelId: channelId as string });
        setVideos(results);
      } catch (error) {
        console.error('Error fetching channel videos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChannelVideos();
  }, [channelId]);

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader className="h-12 w-12 animate-spin" />
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
         <Button onClick={() => router.back()} variant="outline" className="mb-4">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Back to Channels
         </Button>
         {videos.length > 0 && (
            <h1 className="text-3xl font-bold">Videos from {videos[0].channelTitle}</h1>
         )}
      </div>

      {videos.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-16">
              <p>No videos found for this channel.</p>
          </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <Link href={`/youtube/${video.id}`} key={video.id}>
            <Card
                className="overflow-hidden cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
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
  );
}
