
'use client';

import { useParams, useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/player/video-player';
import RealtimeChat from '@/components/realtime-chat';
import { Loader } from 'lucide-react';
import { Suspense } from 'react';

function WatchExternalVideoContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get('url');
  const title = searchParams.get('title');
  const isLive = searchParams.get('live') === 'true';
  const chatId = searchParams.get('chatId');

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-black">
      <main className="flex-1 flex flex-col overflow-auto">
        <VideoPlayer videoUrl={videoUrl} title={title || undefined} />
      </main>
      {chatId && isLive && (
        <aside className="w-full lg:w-96 lg:h-screen flex flex-col border-l bg-background">
          <RealtimeChat chatId={chatId} />
        </aside>
      )}
    </div>
  );
}


export default function WatchExternalVideoPage() {
    return (
        <Suspense fallback={<div className="fixed inset-0 bg-black z-50 h-screen w-screen flex items-center justify-center"><Loader className="animate-spin text-white" /></div>}>
            <WatchExternalVideoContent />
        </Suspense>
    )
}

    