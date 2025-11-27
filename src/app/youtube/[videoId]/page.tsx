
'use client';

import { useParams } from 'next/navigation';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function YouTubePlayerPage() {
  const { videoId } = useParams();

  if (!videoId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>वीडियो ID नहीं मिला।</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>वीडियो प्लेयर</CardTitle>
                </CardHeader>
                <CardContent>
                    <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1&hl=hi&controls=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </AspectRatio>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
