
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useToast } from '@/hooks/use-toast';


// Function to extract YouTube Video ID from various URL formats
const getYouTubeID = (url: string) => {
    const arr = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return (arr[2] !== undefined) ? arr[2].split(/[^0-9a-z_\-]/i)[0] : arr[0];
}


export default function WatchPage() {
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    // Check for a video URL from the query params
    const initialVideoUrl = searchParams.get('v') || '';
    
    // State for the currently playing video ID
    const [videoId, setVideoId] = useState(initialVideoUrl ? getYouTubeID(initialVideoUrl) : '');
    // State for the input field
    const [inputUrl, setInputUrl] = useState(initialVideoUrl);

    const handleWatchClick = () => {
        if (!inputUrl.trim()) {
            toast({ variant: 'destructive', title: 'URL खाली है', description: 'कृपया एक यूट्यूब URL दर्ज करें।'});
            return;
        }
        const newVideoId = getYouTubeID(inputUrl);
        if (newVideoId) {
            setVideoId(newVideoId);
        } else {
            toast({ variant: 'destructive', title: 'गलत URL', description: 'इस URL से वीडियो ID नहीं मिल सका। कृपया सही यूट्यूब URL दर्ज करें।'});
        }
    };

    // Construct the YouTube embed URL for privacy-enhanced mode and without related videos
    const embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` : '';

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>वीडियो देखें</CardTitle>
                    <CardDescription>यूट्यूब वीडियो का लिंक दर्ज करें और देखें।</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex w-full items-center space-x-2">
                        <Input
                            type="text"
                            placeholder="यूट्यूब वीडियो URL (जैसे, https://www.youtube.com/watch?v=...)"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
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
