
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, Video, FileText, AlertTriangle, ArrowLeft, Newspaper, Youtube, Book, ClipboardCheck, PlayCircle, Eye, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { getYouTubeID } from '@/lib/youtube';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMemo } from 'react';

type ContentItemProps = { 
  item: any; 
  courseId: string;
};

function ContentItem({ item, courseId }: ContentItemProps) {
    const router = useRouter();

    const getIcon = () => {
        switch(item.type) {
            case 'youtube': return <Youtube className="h-5 w-5 shrink-0 text-red-500" />;
            case 'video': return <Video className="h-5 w-5 shrink-0" />;
            case 'pdf': return <FileText className="h-5 w-5 shrink-0" />;
            case 'pyq': return <Newspaper className="h-5 w-5 shrink-0" />;
            case 'test': return <ClipboardCheck className="h-5 w-5 shrink-0 text-blue-500" />;
            default: return <Book className="h-5 w-5 shrink-0" />;
        }
    };
    
    const getActionPath = () => {
         switch (item.type) {
            case 'youtube':
            case 'video':
                 const videoId = getYouTubeID(item.url);
                 if (videoId) {
                    return `/courses/watch/${videoId}?live=${item.isLive}&chatId=${courseId}`;
                 }
                 return `/courses/watch/external?url=${encodeURIComponent(item.url)}&live=${item.isLive}&chatId=${courseId}`;
            case 'pdf':
            case 'pyq':
                return `/pdf-viewer?url=${encodeURIComponent(item.url)}`;
            case 'test':
                 return `/courses/test/${item.id}?courseId=${courseId}`;
            default:
                return '#';
        }
    }

    const getActionText = () => {
        switch (item.type) {
            case 'youtube':
            case 'video':
                return 'Play Video';
            case 'pdf':
            case 'pyq':
                return 'View PDF';
            case 'test':
                return 'Start Test';
            default:
                return 'View';
        }
    };
    
     const getActionIcon = () => {
        switch (item.type) {
            case 'youtube':
            case 'video':
                return <PlayCircle className="h-4 w-4" />;
            case 'pdf':
            case 'pyq':
                return <Eye className="h-4 w-4" />;
            case 'test':
                return <PlayCircle className="h-4 w-4" />;
            default:
                return <Eye className="h-4 w-4" />;
        }
    };

    return (
         <Card>
            <CardContent className="p-3 flex gap-3 items-center justify-between">
                <div className="flex gap-3 items-center flex-1 min-w-0">
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
                </div>
                <Button asChild size="sm">
                   <Link href={getActionPath()}>
                        {getActionIcon()}
                        <span className="ml-2">{getActionText()}</span>
                   </Link>
                </Button>
            </CardContent>
        </Card>
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

  const courseContent = useMemo(() => (course?.content && Array.isArray(course.content)) ? course.content : [], [course]);

  const videos = useMemo(() => courseContent.filter(item => item.type === 'youtube' || item.type === 'video'), [courseContent]);
  const documents = useMemo(() => courseContent.filter(item => item.type === 'pdf'), [courseContent]);
  const pyqs = useMemo(() => courseContent.filter(item => item.type === 'pyq'), [courseContent]);
  const tests = useMemo(() => courseContent.filter(item => item.type === 'test'), [courseContent]);
  
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
  
  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{course.name}</CardTitle>
          <CardDescription>इस कोर्स के सभी कंटेंट नीचे दिए गए हैं।</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="videos" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="videos">Videos ({videos.length})</TabsTrigger>
                    <TabsTrigger value="notes">Notes ({documents.length})</TabsTrigger>
                    <TabsTrigger value="pyqs">PYQs ({pyqs.length})</TabsTrigger>
                    <TabsTrigger value="tests">Tests ({tests.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="videos" className="mt-4 space-y-3">
                    {videos.length > 0 ? videos.map((item: any) => (
                        <ContentItem key={item.id} item={item} courseId={courseId as string} />
                    )) : <p className="text-center text-muted-foreground p-8">No videos in this course.</p>}
                </TabsContent>

                <TabsContent value="notes" className="mt-4 space-y-3">
                    {documents.length > 0 ? documents.map((item: any) => (
                        <ContentItem key={item.id} item={item} courseId={courseId as string} />
                    )) : <p className="text-center text-muted-foreground p-8">No documents in this course.</p>}
                </TabsContent>
                
                 <TabsContent value="pyqs" className="mt-4 space-y-3">
                    {pyqs.length > 0 ? pyqs.map((item: any) => (
                        <ContentItem key={item.id} item={item} courseId={courseId as string} />
                    )) : <p className="text-center text-muted-foreground p-8">No PYQs in this course.</p>}
                </TabsContent>

                <TabsContent value="tests" className="mt-4 space-y-3">
                    {tests.length > 0 ? tests.map((item: any) => (
                        <ContentItem key={item.id} item={item} courseId={courseId as string} />
                    )) : <p className="text-center text-muted-foreground p-8">No tests in this course.</p>}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
