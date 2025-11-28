
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader } from 'lucide-react';
import VideoPlayer from '@/components/player/video-player';

const getYouTubeID = (url: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
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
    <div className="fixed inset-0 bg-black">
      <VideoPlayer videoId={videoId} title={title} />
    </div>
  );
}
