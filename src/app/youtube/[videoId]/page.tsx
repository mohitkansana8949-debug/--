
'use client';

import { useParams } from 'next/navigation';
import VideoPlayer from '@/components/player/video-player';

export default function YouTubePlayerPage() {
  const { videoId } = useParams();

  return (
    <div className="fixed inset-0 bg-black">
      <VideoPlayer videoId={videoId as string} title="यूट्यूब वीडियो" />
    </div>
  );
}
