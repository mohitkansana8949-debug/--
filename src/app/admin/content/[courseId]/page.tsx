
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft, PlusCircle, Youtube, FileText, FileQuestion, ClipboardCheck, Trash2, Video, Wand2 } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { getYouTubeID } from '@/lib/youtube';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type ContentType = 'youtube' | 'pdf' | 'pyq' | 'test';

const jsonTestExample = `[
  {
    "question": "भारत की राजधानी क्या है?",
    "options": [
      "मुंबई",
      "नई दिल्ली",
      "कोलकाता",
      "चेन्नई"
    ],
    "answer": "नई दिल्ली"
  }
]`;

type FetchedYouTubeDetails = {
  title: string;
  thumbnailUrl: string;
};

function AddContentForm({ courseRef, pyqs, pyqsLoading, onContentAdded }: { courseRef: any, pyqs: any[], pyqsLoading: boolean, onContentAdded: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // YouTube specific state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetchingYT, setIsFetchingYT] = useState(false);
  const [fetchedYTDetails, setFetchedYTDetails] = useState<FetchedYouTubeDetails | null>(null);
  const [isLive, setIsLive] = useState(false);
  
  // PDF specific state
  const [pdfUrl, setPdfUrl] = useState('');
  
  // PYQ specific state
  const [selectedPyq, setSelectedPyq] = useState('');
  
  // Test specific state
  const [testJson, setTestJson] = useState('');

  // Common state
  const [title, setTitle] = useState('');

  const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  const handleFetchYouTubeDetails = async () => {
    const videoId = getYouTubeID(youtubeUrl);
    if (!videoId) {
      toast({ variant: 'destructive', title: 'Invalid URL', description: 'Could not extract Video ID from the URL.' });
      return;
    }
    if (!youtubeApiKey) {
      toast({ variant: 'destructive', title: 'API Key Missing', description: 'YouTube API key is not configured.' });
      return;
    }

    setIsFetchingYT(true);
    setFetchedYTDetails(null);
    try {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`;
      const response = await fetch(detailsUrl);
      const data = await response.json();
      if (!response.ok || data.items.length === 0) {
        throw new Error(data.error?.message || 'Video not found or API error.');
      }
      const snippet = data.items[0].snippet;
      setFetchedYTDetails({
        title: snippet.title,
        thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
      });
      // Auto-fill the title
      setTitle(snippet.title);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({ variant: 'destructive', title: 'Error fetching details', description: error.message });
    } finally {
      setIsFetchingYT(false);
    }
  };

  const handleAddContent = async (type: ContentType, isDemo = false) => {
    if (!courseRef) return;
    
    let contentTitle = title;
    // For YouTube, title is auto-fetched, so it should exist if details are fetched
    if (type === 'youtube' && fetchedYTDetails) {
        contentTitle = fetchedYTDetails.title;
    }

    if (!contentTitle.trim()) {
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया कंटेंट के लिए एक शीर्षक दर्ज करें।' });
        return;
    };

    let contentData: any = { type, title: contentTitle, id: Date.now().toString() };
    
    switch (type) {
        case 'youtube':
            if (!youtubeUrl.trim() || !fetchedYTDetails) {
                toast({ variant: 'destructive', title: 'त्रुटि', description: 'Please fetch YouTube video details first.' });
                return;
            }
            contentData.url = youtubeUrl;
            contentData.thumbnail = fetchedYTDetails.thumbnailUrl;
            contentData.isLive = isLive;
            break;
        case 'pdf':
            if (!pdfUrl.trim()) {
                toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया PDF URL दर्ज करें।' });
                return;
            }
            contentData.url = pdfUrl;
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
        case 'test':
             try {
                const parsedJson = JSON.parse(testJson);
                if (!Array.isArray(parsedJson) || parsedJson.length === 0) {
                     toast({ variant: 'destructive', title: 'त्रुटि', description: 'JSON अमान्य है या यह एक खाली ऐरे (array) है।' });
                     return;
                }
                contentData.data = parsedJson;
             } catch {
                toast({ variant: 'destructive', title: 'त्रुटि', 'description': 'अमान्य JSON फॉर्मेट।' });
                return;
             }
             break;
        default:
            toast({ variant: 'destructive', title: 'अमान्य प्रकार' });
            return;
    }

    setIsSubmitting(true);
    
    const fieldToUpdate = isDemo ? 'demoContent' : 'content';
    
    updateDoc(courseRef, { [fieldToUpdate]: arrayUnion(contentData) })
      .then(() => {
        toast({ title: 'सफलता!', description: 'नया कंटेंट सफलतापूर्वक जोड़ दिया गया है।' });
        onContentAdded();
        // Clear fields
        setTitle('');
        setYoutubeUrl('');
        setPdfUrl('');
        setSelectedPyq('');
        setTestJson('');
        setIsLive(false);
        setFetchedYTDetails(null);
      })
      .catch((error) => {
        console.error("Content update error:", error);
        const contextualError = new FirestorePermissionError({
          operation: 'update',
          path: courseRef.path,
          requestResourceData: { [fieldToUpdate]: arrayUnion(contentData) },
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const activeTab = document.querySelector<HTMLButtonElement>('[data-state="active"]')?.value as ContentType | undefined;

  return (
    <Tabs defaultValue="youtube" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="youtube"><Youtube className="mr-1 h-4 w-4" />YT</TabsTrigger>
          <TabsTrigger value="pdf"><FileText className="mr-1 h-4 w-4" />PDF</TabsTrigger>
          <TabsTrigger value="pyq"><FileQuestion className="mr-1 h-4 w-4" />PYQ</TabsTrigger>
          <TabsTrigger value="test"><ClipboardCheck className="mr-1 h-4 w-4" />Test</TabsTrigger>
      </TabsList>
      <div className="space-y-4 pt-6">
          <div className="space-y-2">
              <Label htmlFor="content-title">Content Title</Label>
              <Input 
                id="content-title" 
                placeholder={activeTab === 'youtube' ? 'Auto-fetched from YouTube' : 'e.g., Chapter 1: Introduction'}
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                disabled={activeTab === 'youtube'}
              />
          </div>
          <TabsContent value="youtube" className="space-y-4 m-0">
              <div className="space-y-2">
                  <Label htmlFor="youtube-url">YouTube Video URL</Label>
                  <div className="flex items-center gap-2">
                    <Input id="youtube-url" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                    <Button type="button" onClick={handleFetchYouTubeDetails} disabled={isFetchingYT || !youtubeUrl} size="sm">
                      {isFetchingYT ? <Loader className="animate-spin" /> : <Wand2 />}
                    </Button>
                  </div>
              </div>
              {isFetchingYT && <Skeleton className="h-28 w-full" />}
              {fetchedYTDetails && (
                <Card className="p-3 bg-muted/50 flex items-center gap-4">
                  <Image src={fetchedYTDetails.thumbnailUrl} alt="YouTube Thumbnail" width={120} height={68} className="rounded-md border aspect-video object-cover" />
                  <p className="text-sm font-semibold line-clamp-2">{fetchedYTDetails.title}</p>
                </Card>
              )}
              <div className="flex items-center space-x-2">
                  <Switch id="yt-live-switch" checked={isLive} onCheckedChange={setIsLive} />
                  <Label htmlFor="yt-live-switch">Set as Live</Label>
              </div>
          </TabsContent>
          <TabsContent value="pdf" className="space-y-4 m-0">
               <div className="space-y-2">
                  <Label htmlFor="pdf-url">PDF/Notes URL</Label>
                  <Input id="pdf-url" placeholder="https://..." value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} />
              </div>
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
          </TabsContent>
           <TabsContent value="test" className="space-y-4 m-0">
               <div className="space-y-2">
                  <Label htmlFor="test-json">Test Questions (JSON format)</Label>
                  <Textarea 
                      id="test-json" 
                      placeholder={jsonTestExample} 
                      value={testJson} 
                      onChange={(e) => setTestJson(e.target.value)} 
                      rows={10}
                  />
              </div>
          </TabsContent>

          <div className="flex gap-4 pt-4">
            <Button onClick={() => handleAddContent(activeTab || 'youtube', false)} disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader className="animate-spin" /> : 'Add to Full Course'}
            </Button>
            <Button onClick={() => handleAddContent(activeTab || 'youtube', true)} disabled={isSubmitting} variant="secondary" className="w-full">
                {isSubmitting ? <Loader className="animate-spin" /> : 'Add as Demo'}
            </Button>
          </div>
      </div>
  </Tabs>
  );
}


export default function EditCourseContentPage() {
  const { courseId } = useParams();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [refresh, setRefresh] = useState(0);

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
    [firestore, courseId, refresh]
  );
  const { data: course, isLoading: courseLoading } = useDoc(courseRef);

  const pyqsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'pyqs') : null), [firestore]);
  const { data: pyqs, isLoading: pyqsLoading } = useCollection(pyqsQuery);
  
  const handleContentChange = () => {
      setRefresh(prev => prev + 1);
  }

  const handleDeleteContent = async (contentItem: any, isDemo: boolean) => {
    if (!firestore || !courseRef) return;
    const fieldToUpdate = isDemo ? 'demoContent' : 'content';
    updateDoc(courseRef, { [fieldToUpdate]: arrayRemove(contentItem) })
      .then(() => {
        toast({ title: 'सफलता!', description: 'कंटेंट सफलतापूर्वक हटा दिया गया है।' });
        handleContentChange();
      })
      .catch((error) => {
        console.error("Content delete error:", error);
        const contextualError = new FirestorePermissionError({
          operation: 'update',
          path: courseRef.path,
          requestResourceData: { [fieldToUpdate]: arrayRemove(contentItem) },
        });
        errorEmitter.emit('permission-error', contextualError);
      });
  };

  const courseContent = (course?.content && Array.isArray(course.content)) ? course.content : [];
  const demoContent = (course?.demoContent && Array.isArray(course.demoContent)) ? course.demoContent : [];

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
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><PlusCircle className="mr-2 h-5 w-5"/>Add New Content</CardTitle>
            </CardHeader>
            <CardContent>
              <AddContentForm courseRef={courseRef} pyqs={pyqs || []} pyqsLoading={pyqsLoading} onContentAdded={handleContentChange} />
            </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
              <CardHeader>
                  <CardTitle>Full Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2">
                      {courseLoading ? (
                          <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                      ) : courseContent.length > 0 ? (
                        courseContent.map((item: any, index: number) => (
                          <Card key={`full-${item.id || index}`}>
                              <CardContent className="p-3 flex justify-between items-center">
                                  <p className="font-medium flex-1">{item.title} <span className="text-xs text-muted-foreground ml-2">({item.type})</span></p>
                                   <AlertDialog>
                                      <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                                      <AlertDialogContent>
                                          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}" from the full course.</AlertDialogDescription></AlertDialogHeader>
                                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteContent(item, false)}>Delete</AlertDialogAction></AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </CardContent>
                          </Card>
                        ))
                      ) : (
                          <p className="text-muted-foreground text-center p-4">No full course content has been added yet.</p>
                      )}
                  </div>
              </CardContent>
          </Card>
           <Card>
              <CardHeader>
                  <CardTitle>Demo Content</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="space-y-2">
                      {courseLoading ? (
                          <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                      ) : demoContent.length > 0 ? (
                        demoContent.map((item: any, index: number) => (
                          <Card key={`demo-${item.id || index}`}>
                              <CardContent className="p-3 flex justify-between items-center">
                                  <p className="font-medium flex-1">{item.title} <span className="text-xs text-muted-foreground ml-2">({item.type})</span></p>
                                   <AlertDialog>
                                      <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                                      <AlertDialogContent>
                                          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}" from the demo.</AlertDialogDescription></AlertDialogHeader>
                                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteContent(item, true)}>Delete</AlertDialogAction></AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              </CardContent>
                          </Card>
                        ))
                      ) : (
                          <p className="text-muted-foreground text-center p-4">No demo content has been added yet.</p>
                      )}
                  </div>
              </CardContent>
          </Card>
        </div>

      </div>
      </div>
    </div>
  );
}
