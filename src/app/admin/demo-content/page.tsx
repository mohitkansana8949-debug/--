
'use client';

import { useState } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, PlusCircle, Video, FileText, Trash2, ArrowLeft } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const demoContentQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'demoContent') : null),
    [firestore]
  );
  const { data: demoItems, isLoading: demoLoading } = useCollection<DemoItem>(demoContentQuery);

  const handleAddContent = async (type: 'video' | 'pdf') => {
    if (!firestore || !title.trim() || !url.trim()) {
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'कृपया शीर्षक और URL दोनों दर्ज करें।' });
        return;
    };

    let contentData = { 
        type, 
        title, 
        url,
        createdAt: serverTimestamp()
    };

    setIsSubmitting(true);
    
    addDoc(collection(firestore, 'demoContent'), contentData)
      .then(() => {
        toast({ title: 'सफलता!', description: 'नया डेमो कंटेंट सफलतापूर्वक जोड़ दिया गया है।' });
        setTitle('');
        setUrl('');
      })
      .catch((error) => {
        console.error("Demo content creation error:", error);
        const contextualError = new FirestorePermissionError({
          operation: 'create',
          path: 'demoContent',
          requestResourceData: contentData,
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleDelete = async (id: string) => {
      if (!firestore) return;
      const docRef = doc(firestore, 'demoContent', id);
      await deleteDoc(docRef);
      toast({ title: 'हटा दिया गया', description: 'डेमो कंटेंट हटा दिया गया है।'});
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
                <CardDescription>Add videos or PDFs that users can see in the 'Demo Course' section.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="video" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="video"><Video className="mr-1 h-4 w-4" />Video</TabsTrigger>
                        <TabsTrigger value="pdf"><FileText className="mr-1 h-4 w-4" />PDF</TabsTrigger>
                    </TabsList>
                    <div className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="content-title">Content Title</Label>
                            <Input id="content-title" placeholder="e.g., Demo Lecture 1" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="content-url">Content URL</Label>
                            <Input id="content-url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
                        </div>

                        <TabsContent value="video" className="space-y-4 m-0">
                            <Button onClick={() => handleAddContent('video')} disabled={isSubmitting} className="w-full">
                                {isSubmitting ? <Loader className="animate-spin" /> : 'Add Demo Video'}
                            </Button>
                        </TabsContent>

                        <TabsContent value="pdf" className="space-y-4 m-0">
                            <Button onClick={() => handleAddContent('pdf')} disabled={isSubmitting} className="w-full">
                                {isSubmitting ? <Loader className="animate-spin" /> : 'Add Demo PDF'}
                            </Button>
                        </TabsContent>
                    </div>
                </Tabs>
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
