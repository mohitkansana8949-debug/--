'use client';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, AlertTriangle } from 'lucide-react';
import VideoPlayer from '@/components/player/video-player';
import YouTubeChatReplay from '@/components/youtube-chat-replay';
import RealtimeChat from '@/components/realtime-chat';

export default function LiveClassWatchPage() {
  const { liveClassId } = useParams();
  const firestore = useFirestore();

  const liveClassRef = useMemoFirebase(
    () => (firestore && liveClassId ? doc(firestore, 'liveClasses', liveClassId as string) : null),
    [firestore, liveClassId]
  );
  const { data: liveClass, isLoading } = useDoc(liveClassRef);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Loader className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold">लाइव क्लास नहीं मिली</h2>
        <p>हो सकता है कि यह क्लास हटा दी गई हो या लिंक गलत हो।</p>
      </div>
    );
  }

  // If class is live, show real-time chat. If it's completed, show replay.
  const showLiveChat = liveClass.status === 'live' && liveClass.liveChatId;
  const showChatReplay = liveClass.status === 'completed' && liveClass.liveChatId;
  const chatId = liveClass.liveChatId || liveClass.id;
  
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col lg:flex-row h-screen w-screen p-0 gap-0">
        <div className="flex-grow flex flex-col relative">
            <VideoPlayer title={liveClass.title} videoId={liveClass.youtubeVideoId} />
        </div>
        <div className="w-full lg:w-96 h-1/2 lg:h-full shrink-0 bg-background p-2">
            {showLiveChat ? <RealtimeChat chatId={chatId} /> : showChatReplay ? <YouTubeChatReplay liveChatId={liveClass.liveChatId} /> : <div className="flex h-full items-center justify-center text-muted-foreground">इस वीडियो के लिए चैट उपलब्ध नहीं है।</div>}
        </div>
    </div>
  );
}
