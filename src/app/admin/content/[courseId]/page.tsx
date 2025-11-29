
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, PlusCircle, Youtube, Video, FileText, FileJson, FileQuestion } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { getYouTubeID } from '@/lib/youtube';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ContentType = 'youtube' | 'video' | 'pdf' | 'test' | 'pyq';

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
  const [selectedPyq, setSelectedPyq] = useState('');
  const [title, setTitle] = useState('');
  const [isLive, setIsLive] = useState(false);

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
    [firestore, courseId]
  );
  const { data: course, isLoading: courseLoading } = useDoc(courseRef);

  const pyqsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'pyqs') : null), [firestore]);
  const { data: pyqs, isLoading: pyqsLoading } = useCollection(pyqsQuery);

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

    let contentData: any = { type, title, id: Date.now().toString() };
    
    switch (type) {
        case 'youtube':
            if (!youtubeUrl.trim()) {
                toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया यूट्यूब URL दर्ज करें।' });
                return;
            }
            contentData.url = youtubeUrl;
            contentData.thumbnail = youtubeThumbnail;
            contentData.isLive = isLive;
            break;
        case 'video':
            if (!videoUrl.trim()) {
                toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया वीडियो URL दर्ज करें।' });
                return;
            }
            contentData.url = videoUrl;
            contentData.isLive = isLive;
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
        case 'pyq':
            const pyq = pyqs?.find(p => p.id === selectedPyq);
            if (!pyq) {
                 toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया एक PYQ चुनें।' });
                return;
            }
            contentData.url = pyq.pdfUrl;
            contentData.name = pyq.name;
            contentData.price = pyq.price;
            contentData.isFree = pyq.isFree;
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
        setSelectedPyq('');
        setIsLive(false);
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

  const courseContent = (course?.content && Array.isArray(course.content)) ? course.content : [];

  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="p-4 border-b flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/admin/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
         {courseLoading ? (
            <Skeleton className="h-8 w-1/2" />
          ) : (
            <h1 className="text-xl font-semibold">Manage Content: {course?.name}</h1>
        )}
      </header>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column for adding content */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><PlusCircle className="mr-2 h-5 w-5"/>Add New Content</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="youtube" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
                        <TabsTrigger value="youtube"><Youtube className="mr-1 h-4 w-4" />YT</TabsTrigger>
                        <TabsTrigger value="video"><Video className="mr-1 h-4 w-4" />Video</TabsTrigger>
                        <TabsTrigger value="pdf"><FileText className="mr-1 h-4 w-4" />PDF</TabsTrigger>
                        <TabsTrigger value="pyq"><FileQuestion className="mr-1 h-4 w-4" />PYQ</TabsTrigger>
                        <TabsTrigger value="test"><FileJson className="mr-1 h-4 w-4" />Test</TabsTrigger>
                    </TabsList>
                    <div className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="content-title">Content Title</Label>
                            <Input id="content-title" placeholder="e.g., Chapter 1: Introduction" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                        <TabsContent value="youtube" className="space-y-4 m-0">
                            <div className="space-y-2">
                                <Label htmlFor="youtube-url">YouTube Video URL</Label>
                                <Input id="youtube-url" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="yt-live-switch" checked={isLive} onCheckedChange={setIsLive} />
                                <Label htmlFor="yt-live-switch">Set as Live</Label>
                            </div>
                            {youtubeThumbnail && <Image src={youtubeThumbnail} alt="YouTube Thumbnail" width={240} height={135} className="rounded-md border" />}
                            <Button onClick={() => handleAddContent('youtube')} disabled={isSubmitting}>
                                {isSubmitting ? <Loader className="animate-spin" /> : 'Add YouTube Video'}
                            </Button>
                        </TabsContent>
                        <TabsContent value="video" className="space-y-4 m-0">
                             <div className="space-y-2">
                                <Label htmlFor="video-url">Other Video URL (JioCloud, etc)</Label>
                                <Input id="video-url" placeholder="https://..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                            </div>
                             <div className="flex items-center space-x-2">
                                <Switch id="video-live-switch" checked={isLive} onCheckedChange={setIsLive} />
                                <Label htmlFor="video-live-switch">Set as Live</Label>
                            </div>
                            <Button onClick={() => handleAddContent('video')} disabled={isSubmitting}>
                                {isSubmitting ? <Loader className="animate-spin" /> : 'Add Video'}
                            </Button>
                        </TabsContent>
                        <TabsContent value="pdf" className="space-y-4 m-0">
                             <div className="space-y-2">
                                <Label htmlFor="pdf-url">PDF/Notes URL</Label>
                                <Input id="pdf-url" placeholder="https://..." value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} />
                            </div>
                            <Button onClick={() => handleAddContent('pdf')} disabled={isSubmitting}>
                                {isSubmitting ? <Loader className="animate-spin" /> : 'Add PDF/Notes'}
                            </Button>
                        </TabsContent>
                        <TabsContent value="pyq" className="space-y-4 m-0">
                             <div className="space-y-2">
                                <Label htmlFor="pyq-select">Select PYQ</Label>
                                <Select onValueChange={setSelectedPyq} value={selectedPyq}>
                                    <SelectTrigger id="pyq-select">
                                        <SelectValue placeholder={pyqsLoading ? "Loading PYQs..." : "Select a PYQ"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pyqs?.map(pyq => (
                                            <SelectItem key={pyq.id} value={pyq.id}>{pyq.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={() => handleAddContent('pyq')} disabled={isSubmitting}>
                                {isSubmitting ? <Loader className="animate-spin" /> : 'Add PYQ'}
                            </Button>
                        </TabsContent>
                         <TabsContent value="test" className="space-y-4 m-0">
                             <div className="space-y-2">
                                <Label htmlFor="test-json">Test Series JSON</Label>
                                <Textarea id="test-json" placeholder='[{"question": "...", "options": [...]}]' value={testJson} onChange={(e) => setTestJson(e.target.value)} rows={10} />
                            </div>
                            <Button onClick={() => handleAddContent('test')} disabled={isSubmitting}>
                                {isSubmitting ? <Loader className="animate-spin" /> : 'Add Test Series'}
                            </Button>
                        </TabsContent>
                    </div>
                </Tabs>
            </CardContent>
        </Card>

        {/* Right column for existing content */}
        <Card>
            <CardHeader>
                <CardTitle>Existing Content</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {courseLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : courseContent.length > 0 ? (
                      courseContent.map((item: any, index: number) => (
                        <Card key={item.id || index}>
                            <CardContent className="p-3 flex justify-between items-center">
                                <p className="font-medium">{item.title} <span className="text-xs text-muted-foreground ml-2">({item.type})</span></p>
                                {/* TODO: Add edit/delete functionality */}
                            </CardContent>
                        </Card>
                      ))
                    ) : (
                        <p className="text-muted-foreground text-center p-4">No content has been added yet.</p>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
