
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';

export default function WatchPage() {
    const searchParams = useSearchParams();
    const initialVideoId = searchParams.get('v') || '';
    const [videoId, setVideoId] = useState(initialVideoId);
    const [inputVideoId, setInputVideoId] = useState(initialVideoId);

    const handleWatchClick = () => {
        setVideoId(inputVideoId);
    };

    // Construct the YouTube embed URL for privacy-enhanced mode and without related videos
    const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : '';

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>वीडियो देखें</CardTitle>
                    <CardDescription>यूट्यूब वीडियो ID दर्ज करें और देखें।</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            type="text"
                            placeholder="यूट्यूब वीडियो ID (जैसे, dQw4w9WgXcQ)"
                            value={inputVideoId}
                            onChange={(e) => setInputVideoId(e.target.value)}
                        />
                        <Button onClick={handleWatchClick}>देखें</Button>
                    </div>

                    {videoId && (
                        <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
                            <iframe
                                src={embedUrl}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full"
                            ></iframe>
                        </AspectRatio>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
