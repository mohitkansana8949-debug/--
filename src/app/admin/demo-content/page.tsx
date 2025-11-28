
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Video, FileText, Trash2, ArrowLeft, UploadCloud } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/ai/flows/b2-upload-flow';
import { AxiosProgressEvent } from 'axios';

type DemoItem = {
    id: string;
    title: string;
    url: string;
    type: 'video' | 'pdf';
};

export default function ManageDemoContentPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const demoContentQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'demoContent') : null),
    [firestore]
  );
  const { data: demoItems, isLoading: demoLoading } = useCollection<DemoItem>(demoContentQuery);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };


  const handleAddContent = async () => {
    if (!firestore || !title.trim() || !file) {
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया शीर्षक और फ़ाइल दोनों चुनें।' });
        return;
    };

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
        // 1. Upload the file to B2
        const uploadResult = await uploadFile(file, (progressEvent: AxiosProgressEvent) => {
            if (progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
            }
        });
        const fileUrl = `https://f005.backblazeb2.com/file/quickly-study/${encodeURIComponent(uploadResult.fileName)}`;

        // 2. Add the metadata to Firestore
        const fileType = file.type.startsWith('video') ? 'video' : 'pdf';
        
        let contentData = { 
            type: fileType, 
            title, 
            url: fileUrl,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(firestore, 'demoContent'), contentData);
        
        toast({ title: 'सफलता!', description: 'नया डेमो कंटेंट सफलतापूर्वक जोड़ दिया गया है।' });

        // Reset form
        setTitle('');
        setFile(null);
        setUploadProgress(null);

    } catch (error: any) {
        console.error("Demo content creation error:", error);
        toast({ variant: 'destructive', title: 'त्रुटि', description: error.message || 'डेमो कंटेंट बनाने में एक अप्रत्याशित त्रुटि हुई।' });
        // Error is already emitted from the flow, no need to do it here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (!firestore) return;
      const docRef = doc(firestore, 'demoContent', id);
      
      deleteDoc(docRef).then(() => {
          toast({ title: 'हटा दिया गया', description: 'डेमो कंटेंट हटा दिया गया है।'});
      }).catch(error => {
            const contextualError = new FirestorePermissionError({
                operation: 'delete',
                path: docRef.path,
            });
            errorEmitter.emit('permission-error', contextualError);
      })
  }

  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="p-4 border-b flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Manage Demo Content</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center"><PlusCircle className="mr-2 h-5 w-5"/>Add New Demo Content</CardTitle>
                <CardDescription>Upload videos or PDFs directly from your device for the demo section.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="content-title">Content Title</Label>
                    <Input id="content-title" placeholder="e.g., Demo Lecture 1" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="file-upload">File (Video or PDF)</Label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground"/>
                                <p className="mb-2 text-sm text-muted-foreground">{file ? file.name : <span className="font-semibold">Click to upload</span>}</p>
                                <p className="text-xs text-muted-foreground">MP4, MOV, WEBM or PDF</p>
                            </div>
                            <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="video/*,application/pdf" />
                        </label>
                    </div> 
                </div>

                {uploadProgress !== null && isSubmitting && (
                    <div className="space-y-1">
                        <Progress value={uploadProgress} />
                        <p className="text-xs text-center text-muted-foreground">{Math.round(uploadProgress)}%</p>
                    </div>
                )}
                
                <Button onClick={handleAddContent} disabled={isSubmitting || !file || !title} className="w-full">
                    {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> अपलोड हो रहा है...</> : 'Add Demo Content'}
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Existing Demo Content</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {demoLoading ? (
                       <div className="flex justify-center"><Loader className="animate-spin" /></div>
                    ) : demoItems && demoItems.length > 0 ? (
                      demoItems.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="p-3 flex justify-between items-center gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                {item.type === 'video' ? <Video className="h-4 w-4 shrink-0"/> : <FileText className="h-4 w-4 shrink-0" />}
                                <p className="font-medium truncate">{item.title}</p>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
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
      </main>
    </div>
  );
}
