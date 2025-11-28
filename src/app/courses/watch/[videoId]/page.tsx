'use client';

import { useParams } from 'next/navigation';
import VideoPlayer from '@/components/player/video-player';

export default function WatchCourseVideoPage() {
  const { videoId } = useParams();

  return (
    <div className="fixed inset-0 bg-black z-50 h-screen w-screen">
      <VideoPlayer videoId={videoId as string} />
    </div>
  );
}
