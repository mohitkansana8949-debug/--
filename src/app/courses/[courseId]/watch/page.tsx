'use client';

import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader } from 'lucide-react';
import VideoPlayer from '@/components/player/video-player';

// Helper function to extract YouTube Video ID from any URL format
const getYouTubeID = (url: string): string | null => {
  if (!url) return null;

  let ID = '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      ID = urlObj.pathname.substring(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname === '/watch') {
        ID = urlObj.searchParams.get('v') || '';
      } else if (urlObj.pathname.startsWith('/live/')) {
        ID = urlObj.pathname.split('/live/')[1].split('?')[0];
      } else if (urlObj.pathname.startsWith('/embed/')) {
        ID = urlObj.pathname.split('/embed/')[1];
      }
    }
    
    // Remove any extra query parameters from the ID
    if (ID.includes('?')) {
        ID = ID.split('?')[0];
    }
    return ID || null;

  } catch (e) {
     // Fallback for non-URL strings or invalid formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|live\/|v\/|)([\w-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  
  return null;
}

export default function WatchCoursePage() {
  const { courseId } = useParams();
  const firestore = useFirestore();

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
    [firestore, courseId]
  );
  const { data: course, isLoading: courseLoading } = useDoc(courseRef);

  if (courseLoading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center"><Loader className="animate-spin text-white" /></div>;
  }

  const videoId = course?.content ? getYouTubeID(course.content) : null;
  const title = course?.name || 'वीडियो';

  return (
    <div className="fixed inset-0 bg-black z-50 h-screen w-screen">
      <VideoPlayer title={title} videoId={videoId} />
    </div>
  );
}
