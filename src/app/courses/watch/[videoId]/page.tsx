'use client';

import { useParams, useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/player/video-player';
import RealtimeChat from '@/components/realtime-chat';
import { Loader } from 'lucide-react';
import { Suspense } from 'react';

function WatchVideoContent() {
  const { videoId } = useParams();
  const searchParams = useSearchParams();
  const isLive = searchParams.get('live') === 'true';
  const chatId = searchParams.get('chatId');

  return (
    <div className="flex flex-col h-screen bg-black">
      <main className="flex-1 flex flex-col overflow-auto relative">
        <VideoPlayer videoId={videoId as string} />
      </main>
      {isLive && chatId && (
        <aside className="h-[50vh] flex flex-col border-t bg-background">
          <RealtimeChat chatId={chatId} />
        </aside>
      )}
    </div>
  );
}

export default function WatchCourseVideoPage() {
    return (
        <Suspense fallback={<div className="fixed inset-0 bg-black z-50 h-screen w-screen flex items-center justify-center"><Loader className="animate-spin text-white" /></div>}>
            <WatchVideoContent />
        </Suspense>
    )
}
