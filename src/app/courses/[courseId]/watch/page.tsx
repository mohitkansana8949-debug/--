
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader } from 'lucide-react';
import VideoPlayer from '@/components/player/video-player';
import RealtimeChat from '@/components/realtime-chat';
import { useEffect, useState } from 'react';

const getYouTubeID = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return match[2];
  }

  // Handle /live/ URLs
  if (url.includes('/live/')) {
    const parts = url.split('/live/');
    if (parts[1]) {
      return parts[1].split('?')[0];
    }
  }
  
  return null;
}

export default function WatchCoursePage() {
  const { courseId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();

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
    <div className="fixed inset-0 bg-black z-50 flex flex-col lg:flex-row h-screen w-screen p-0 gap-0">
      <div className="flex-grow flex flex-col relative">
        <VideoPlayer videoId={videoId} title={title} />
      </div>
      <div className="w-full lg:w-96 h-1/2 lg:h-full shrink-0 bg-background p-2">
        {courseId && user ? (
          <RealtimeChat chatId={courseId as string} />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted rounded-lg text-center p-4 text-muted-foreground">
              <Loader className="animate-spin" />
              <p className='ml-2'>चैट लोड हो रही है...</p>
          </div>
        )}
      </div>
    </div>
  );
}
