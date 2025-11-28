'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, Video, FileText, ClipboardCheck, MessageSquare, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import RealtimeChat from '@/components/realtime-chat';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getYouTubeID } from '@/lib/youtube';
import VideoPlayer from '@/components/player/video-player';


function TestPlayer({ data }: { data: any[] }) {
    // Basic test renderer.
    return (
        <div className="space-y-6">
            {data.map((question, qIndex) => (
                <Card key={qIndex}>
                    <CardContent className="p-4">
                        <p className="font-bold mb-4">{qIndex + 1}. {question.question}</p>
                        <div className="space-y-2">
                            {question.options.map((option: string, oIndex: number) => (
                                <div key={oIndex} className="flex items-center gap-2 p-2 border rounded-md">
                                    <input type="radio" name={`question-${qIndex}`} id={`q${qIndex}o${oIndex}`} />
                                    <label htmlFor={`q${qIndex}o${oIndex}`}>{option}</label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}


export default function WatchCoursePage() {
  const { courseId } = useParams();
  const firestore = useFirestore();
  const router = useRouter();

  const [activeContent, setActiveContent] = useState<any>(null);

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
    [firestore, courseId]
  );
  const { data: course, isLoading: courseLoading } = useDoc(courseRef);

  useEffect(() => {
    // Set the first video (if any) as the default active content
    if (course && course.content && Array.isArray(course.content) && course.content.length > 0) {
       const firstVideo = course.content.find((c: any) => c.type === 'youtube' || c.type === 'video');
       setActiveContent(firstVideo || course.content[0]);
    }
  }, [course]);

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
  const videos = courseContent.filter((c: any) => c.type === 'youtube' || c.type === 'video') || [];
  const notes = courseContent.filter((c: any) => c.type === 'pdf') || [];
  const tests = courseContent.filter((c: any) => c.type === 'test') || [];
  
  const renderActiveContent = () => {
    if (!activeContent) return <div className="flex items-center justify-center h-full bg-muted rounded-lg"><p>Select content to start</p></div>;

    switch(activeContent.type) {
        case 'youtube':
        case 'video':
            return <VideoPlayer videoUrl={activeContent.url} title={activeContent.title} />;
        case 'pdf':
             return (
                 <div className="h-[calc(100vh-200px)] w-full">
                     <iframe src={activeContent.url} className="w-full h-full border-0" title={activeContent.title}></iframe>
                 </div>
             );
        case 'test':
             return <TestPlayer data={activeContent.data} />;
        default:
            return <p>Unsupported content type.</p>;
    }
  }

  const isChatVisible = activeContent && (activeContent.type === 'youtube' || activeContent.type === 'video') && activeContent.isLive;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
        <main className="flex-1 flex flex-col overflow-auto">
            <div className="p-4 flex-shrink-0">
                <h1 className="text-2xl font-bold">{activeContent?.title || course.name}</h1>
            </div>
            <div className="flex-1 p-4">
                {renderActiveContent()}
            </div>
        </main>
        <aside className="w-full lg:w-96 lg:h-screen flex flex-col border-l bg-card/50">
            <Tabs defaultValue="videos" className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-4 shrink-0 rounded-none">
                    <TabsTrigger value="videos" className="text-xs p-2"><Video className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs p-2"><FileText className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="tests" className="text-xs p-2"><ClipboardCheck className="h-4 w-4" /></TabsTrigger>
                    <TabsTrigger value="doubts" className="text-xs p-2"><MessageSquare className="h-4 w-4" /></TabsTrigger>
                </TabsList>
                <div className="flex-1 overflow-auto">
                    <TabsContent value="videos" className="m-0 p-2 space-y-2">
                         {videos.map((item: any) => (
                            <Card key={item.id} className="cursor-pointer hover:bg-muted" onClick={() => setActiveContent(item)}>
                                <CardContent className="p-2 flex gap-2 items-center">
                                    {item.thumbnail && <Image src={item.thumbnail} alt={item.title} width={120} height={68} className="rounded-md aspect-video object-cover" />}
                                    <p className="font-semibold text-sm line-clamp-2">{item.title}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                    <TabsContent value="notes" className="m-0 p-2 space-y-2">
                        {notes.map((item: any) => (
                             <Card key={item.id} className="cursor-pointer hover:bg-muted" onClick={() => setActiveContent(item)}>
                                <CardContent className="p-3 flex gap-3 items-center">
                                    <FileText className="h-5 w-5 shrink-0" />
                                    <p className="font-semibold text-sm">{item.title}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                    <TabsContent value="tests" className="m-0 p-2 space-y-2">
                         {tests.map((item: any) => (
                             <Card key={item.id} className="cursor-pointer hover:bg-muted" onClick={() => setActiveContent(item)}>
                                <CardContent className="p-3 flex gap-3 items-center">
                                    <ClipboardCheck className="h-5 w-5 shrink-0" />
                                    <p className="font-semibold text-sm">{item.title}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </TabsContent>
                    <TabsContent value="doubts" className="m-0 h-full">
                       {isChatVisible ? (
                           <RealtimeChat chatId={courseId as string} />
                        ) : (
                            <div className="p-4 text-center text-muted-foreground">
                                <MessageSquare className="mx-auto h-8 w-8 mb-2" />
                                <p>This is a recorded class. Chat is not available.</p>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </aside>
    </div>
  );
}
