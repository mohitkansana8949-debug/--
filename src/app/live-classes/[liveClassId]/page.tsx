
'use client';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Loader, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

export default function LiveClassWatchPage() {
  const { liveClassId } = useParams();
  const firestore = useFirestore();

  const [embedHost, setEmbedHost] = useState('');

  useEffect(() => {
    // This ensures window is defined, as it's only available on the client
    setEmbedHost(window.location.hostname);
  }, []);

  const liveClassRef = useMemoFirebase(
    () => (firestore && liveClassId ? doc(firestore, 'liveClasses', liveClassId as string) : null),
    [firestore, liveClassId]
  );
  const { data: liveClass, isLoading } = useDoc(liveClassRef);
  
  const youtubeVideoId = liveClass?.youtubeVideoId;
  const videoSrc = `https://www.youtube.com/embed/${youtubeVideoId}`;
  const chatSrc = embedHost && youtubeVideoId 
    ? `https://www.youtube.com/live_chat?v=${youtubeVideoId}&embed_domain=${embedHost}` 
    : '';

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-center text-muted-foreground p-8">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold">लाइव क्लास नहीं मिली</h2>
        <p>हो सकता है कि यह क्लास हटा दी गई हो या लिंक गलत हो।</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col lg:flex-row h-screen w-screen p-2 gap-2">
        <div className="flex-grow flex flex-col">
            <div className="w-full flex-grow">
                <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden h-full">
                    <iframe
                        src={videoSrc}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                </AspectRatio>
            </div>
        </div>
        <div className="w-full lg:w-96 h-1/2 lg:h-full shrink-0">
        {chatSrc ? (
            <Card className="h-full w-full">
                <iframe
                    src={chatSrc}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                ></iframe>
            </Card>
        ) : (
            <div className="flex h-full items-center justify-center bg-muted rounded-lg">
                <Loader className="animate-spin" />
            </div>
        )}
        </div>
    </div>
  );
}
