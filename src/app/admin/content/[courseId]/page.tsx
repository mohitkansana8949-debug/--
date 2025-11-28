'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, PlusCircle, Youtube, Video, FileText, FileJson } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { getYouTubeID } from '@/lib/youtube';

type ContentType = 'youtube' | 'video' | 'pdf' | 'test';

export default function EditCourseContentPage() {
  const { courseId } = useParams();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeThumbnail, setYoutubeThumbnail] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [testJson, setTestJson] = useState('');
  const [title, setTitle] = useState('');

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
    [firestore, courseId]
  );
  const { data: course, isLoading: courseLoading } = useDoc(courseRef);

  useEffect(() => {
    if (youtubeUrl) {
      const videoId = getYouTubeID(youtubeUrl);
      if (videoId) {
        setYoutubeThumbnail(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
      }
    } else {
        setYoutubeThumbnail('');
    }
  }, [youtubeUrl]);

  const handleAddContent = async (type: ContentType) => {
    if (!firestore || !courseRef || !title.trim()) {
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया कंटेंट के लिए एक शीर्षक दर्ज करें।' });
        return;
    };

    let contentData: any = { type, title, id: Date.now().toString(), isLive: false };
    
    switch (type) {
        case 'youtube':
            if (!youtubeUrl.trim()) {
                toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया यूट्यूब URL दर्ज करें।' });
                return;
            }
            contentData.url = youtubeUrl;
            contentData.thumbnail = youtubeThumbnail;
            contentData.isLive = true; // Default to live
            break;
        case 'video':
            if (!videoUrl.trim()) {
                toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया वीडियो URL दर्ज करें।' });
                return;
            }
            contentData.url = videoUrl;
            contentData.isLive = true; // Default to live
            break;
        case 'pdf':
            if (!pdfUrl.trim()) {
                toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया PDF URL दर्ज करें।' });
                return;
            }
            contentData.url = pdfUrl;
            break;
        case 'test':
             if (!testJson.trim()) {
                toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया टेस्ट का JSON डेटा दर्ज करें।' });
                return;
            }
            try {
                contentData.data = JSON.parse(testJson);
            } catch (e) {
                toast({ variant: 'destructive', title: 'JSON अमान्य', description: 'दर्ज किया गया JSON कोड अमान्य है।' });
                return;
            }
            break;
        default:
            toast({ variant: 'destructive', title: 'अमान्य प्रकार' });
            return;
    }

    setIsSubmitting(true);
    
    updateDoc(courseRef, { content: arrayUnion(contentData) })
      .then(() => {
        toast({ title: 'सफलता!', description: 'नया कंटेंट सफलतापूर्वक जोड़ दिया गया है।' });
        // Clear fields
        setTitle('');
        setYoutubeUrl('');
        setVideoUrl('');
        setPdfUrl('');
        setTestJson('');
      })
      .catch((error) => {
        console.error("Content update error:", error);
        const contextualError = new FirestorePermissionError({
          operation: 'update',
          path: courseRef.path,
          requestResourceData: { content: arrayUnion(contentData) },
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            कंटेंट लिस्ट पर वापस जाएं
          </Link>
        </Button>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          {courseLoading ? (
            <>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              <CardTitle>कंटेंट मैनेज करें: {course?.name}</CardTitle>
              <CardDescription>इस कोर्स में नया कंटेंट जोड़ें या मौजूदा को देखें।</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
            {courseLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-10 w-32" />
                </div>
            ) : (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center"><PlusCircle className="mr-2 h-5 w-5"/>नया कंटेंट जोड़ें</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="youtube" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="youtube"><Youtube className="mr-1 h-4 w-4" />YouTube</TabsTrigger>
                                    <TabsTrigger value="video"><Video className="mr-1 h-4 w-4" />Video</TabsTrigger>
                                    <TabsTrigger value="pdf"><FileText className="mr-1 h-4 w-4" />PDF</TabsTrigger>
                                    <TabsTrigger value="test"><FileJson className="mr-1 h-4 w-4" />Test</TabsTrigger>
                                </TabsList>
                                <div className="space-y-4 pt-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="content-title">कंटेंट का शीर्षक</Label>
                                        <Input id="content-title" placeholder="जैसे, अध्याय 1: परिचय" value={title} onChange={(e) => setTitle(e.target.value)} />
                                    </div>
                                    <TabsContent value="youtube" className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="youtube-url">यूट्यूब वीडियो URL</Label>
                                            <Input id="youtube-url" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                                        </div>
                                        {youtubeThumbnail && <Image src={youtubeThumbnail} alt="YouTube Thumbnail" width={240} height={135} className="rounded-md border" />}
                                        <Button onClick={() => handleAddContent('youtube')} disabled={isSubmitting}>
                                            {isSubmitting ? <Loader className="animate-spin" /> : 'YouTube वीडियो जोड़ें'}
                                        </Button>
                                    </TabsContent>
                                    <TabsContent value="video" className="space-y-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="video-url">अन्य वीडियो URL (JioCloud, आदि)</Label>
                                            <Input id="video-url" placeholder="https://..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                                        </div>
                                        <Button onClick={() => handleAddContent('video')} disabled={isSubmitting}>
                                            {isSubmitting ? <Loader className="animate-spin" /> : 'वीडियो जोड़ें'}
                                        </Button>
                                    </TabsContent>
                                    <TabsContent value="pdf" className="space-y-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="pdf-url">PDF/नोट्स URL</Label>
                                            <Input id="pdf-url" placeholder="https://..." value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} />
                                        </div>
                                        <Button onClick={() => handleAddContent('pdf')} disabled={isSubmitting}>
                                            {isSubmitting ? <Loader className="animate-spin" /> : 'PDF/नोट्स जोड़ें'}
                                        </Button>
                                    </TabsContent>
                                     <TabsContent value="test" className="space-y-4">
                                         <div className="space-y-2">
                                            <Label htmlFor="test-json">टेस्ट सीरीज JSON</Label>
                                            <Textarea id="test-json" placeholder='[{"question": "...", "options": [...]}]' value={testJson} onChange={(e) => setTestJson(e.target.value)} rows={10} />
                                        </div>
                                        <Button onClick={() => handleAddContent('test')} disabled={isSubmitting}>
                                            {isSubmitting ? <Loader className="animate-spin" /> : 'टेस्ट सीरीज जोड़ें'}
                                        </Button>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </CardContent>
                    </Card>

                    <div>
                        <h3 className="text-xl font-bold my-4">मौजूदा कंटेंट</h3>
                        <div className="space-y-2">
                            {course?.content?.length > 0 ? course.content.map((item: any, index: number) => (
                                <Card key={item.id || index}>
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <p>{item.title} <span className="text-xs text-muted-foreground ml-2">({item.type})</span></p>
                                        {/* TODO: Add edit/delete functionality */}
                                    </CardContent>
                                </Card>
                            )) : (
                                <p className="text-muted-foreground text-center p-4">अभी कोई कंटेंट नहीं जोड़ा गया है।</p>
                            )}
                        </div>
                    </div>

                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
