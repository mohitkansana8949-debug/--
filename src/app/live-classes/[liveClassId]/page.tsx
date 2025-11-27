
'use client';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Loader, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function LiveClassWatchPage() {
  const { liveClassId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();

  const liveClassRef = useMemoFirebase(
    () => (firestore && liveClassId ? doc(firestore, 'liveClasses', liveClassId as string) : null),
    [firestore, liveClassId]
  );
  const { data: liveClass, isLoading } = useDoc(liveClassRef);
  
  const youtubeVideoId = liveClass?.youtubeVideoId;
  const videoSrc = `https://www.youtube.com/embed/${youtubeVideoId}`;
  const chatSrc = `https://www.youtube.com/live_chat?v=${youtubeVideoId}&embed_domain=${window.location.hostname}`;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold">लाइव क्लास नहीं मिली</h2>
        <p>हो सकता है कि यह क्लास हटा दी गई हो या लिंक गलत हो।</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">लाइव क्लास: {liveClass.teacherName}</CardTitle>
          <CardDescription>
            {liveClass.startTime && `शुरू होगी: ${format(liveClass.startTime.toDate(), 'PPP p')}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
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
          <div className="h-[50vh] lg:h-auto">
            <Card className="h-full">
                <iframe
                    src={chatSrc}
                    className="w-full h-full rounded-lg"
                    frameBorder="0"
                ></iframe>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
