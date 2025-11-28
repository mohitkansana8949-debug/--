
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, Video, FileText, ClipboardCheck, MessageSquare, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { getYouTubeID } from '@/lib/youtube';

function ContentItem({ item, courseId }: { item: any, courseId: string }) {
    const getIcon = () => {
        switch(item.type) {
            case 'youtube': return <Video className="h-5 w-5 shrink-0 text-red-500" />;
            case 'video': return <Video className="h-5 w-5 shrink-0" />;
            case 'pdf': return <FileText className="h-5 w-5 shrink-0" />;
            case 'test': return <ClipboardCheck className="h-5 w-5 shrink-0" />;
            default: return null;
        }
    };

    const getLink = () => {
        if (item.type === 'pdf') {
            return `/pdf-viewer?url=${encodeURIComponent(item.url)}`;
        }
        const videoId = getYouTubeID(item.url);
        if (videoId) {
             const url = `/courses/watch/${videoId}?live=${item.isLive}&chatId=${courseId}`;
             return url;
        }
        return `/courses/watch/external?url=${encodeURIComponent(item.url)}&live=${item.isLive}&chatId=${courseId}`;
    };

    return (
         <Link href={getLink()} target={item.type === 'pdf' ? '_blank' : '_self'}>
            <Card className="cursor-pointer hover:bg-muted">
                <CardContent className="p-3 flex gap-3 items-center">
                    {getIcon()}
                    <div className="flex-1">
                        <p className="font-semibold text-sm line-clamp-2">{item.title}</p>
                        {item.isLive && (
                           <div className="flex items-center text-xs text-red-500 font-bold mt-1">
                                <span className="relative flex h-2 w-2 mr-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                LIVE
                           </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
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
    return <div className="fixed inset-0 bg-background flex items-center justify-center"><Loader className="animate-spin" /></div>;
  }

  if (!course) {
      return (
          <div className="h-screen flex flex-col items-center justify-center text-center p-4">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-2xl font-bold">Course Not Found</h2>
              <p className="text-muted-foreground">The course you are looking for does not exist or has been removed.</p>
              <Button asChild className="mt-6">
                  <Link href="/courses">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Courses
                  </Link>
              </Button>
          </div>
      )
  }
  
  const courseContent = (course?.content && Array.isArray(course.content)) ? course.content : [];
  
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{course.name}</CardTitle>
          <CardDescription>इस कोर्स के सभी कंटेंट नीचे दिए गए हैं।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {courseContent.length > 0 ? courseContent.map((item: any) => (
             <ContentItem key={item.id} item={item} courseId={courseId as string} />
           )) : (
            <div className="text-center text-muted-foreground p-8">
                <p>इस कोर्स में अभी कोई कंटेंट नहीं है।</p>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

    