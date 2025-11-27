
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Search, Youtube as YoutubeIcon } from 'lucide-react';
import Image from 'next/image';
import { searchVideos, type YouTubeVideo } from '@/ai/flows/youtube-search-flow';

export default function YouTubeSearchPage() {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsLoading(true);
    setVideos([]);
    try {
      const results = await searchVideos({ query });
      setVideos(results);
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoClick = (videoId: string) => {
    router.push(`/youtube/${videoId}`);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
          <YoutubeIcon className="h-10 w-10 text-red-500" />
          यूट्यूब एक्सप्लोर करें
        </h1>
        <p className="text-muted-foreground mt-2">
          यूट्यूब पर कुछ भी खोजें और सीधे ऐप में देखें।
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex max-w-2xl mx-auto gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="वीडियो खोजें..."
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          खोजें
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center mt-8">
          <Loader className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => (
          <Card
            key={video.id}
            onClick={() => handleVideoClick(video.id)}
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
        ))}
      </div>
    </div>
  );
}
