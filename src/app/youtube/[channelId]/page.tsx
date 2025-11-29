'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { youtubeSearchFlow } from '@/ai/flows/youtube-search-flow';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ChannelVideosPage() {
    const { channelId } = useParams();
    const [videos, setVideos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [channelTitle, setChannelTitle] = useState('');

    useEffect(() => {
        const fetchChannelVideos = async () => {
            if (!channelId || typeof channelId !== 'string') return;
            setIsLoading(true);
            setError(null);
            try {
                // To get all videos from a channel, we need to use a different endpoint or a search query.
                // A common trick is to search for "*" within a specific channel.
                // However, the current flow searches globally. We will need a new flow or modify the existing one.
                // For now, let's adapt by just searching for the channel's content.
                const results = await youtubeSearchFlow({ query: '', channelId: channelId });
                setVideos(results.videos);
                if (results.videos.length > 0) {
                    setChannelTitle(results.videos[0].channelTitle);
                }
            } catch (err: any) {
                setError(err.message || "Failed to fetch videos.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchChannelVideos();
    }, [channelId]);

    return (
        <div className="container mx-auto p-4 space-y-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/youtube"><ArrowLeft /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Videos from {isLoading ? '...' : channelTitle}</h1>
                    <p className="text-muted-foreground text-sm">{channelId}</p>
                </div>
            </div>

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
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center mt-16">No videos found for this channel.</p>
            )}
        </div>
    );
}
