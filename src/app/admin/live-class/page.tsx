'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useCollection } from '@/firebase';
import { addDoc, collection, serverTimestamp, doc, deleteDoc } from 'firebase/firestore';
import { Loader, Trash2, Edit } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { getYouTubeVideoDetails } from '@/ai/flows/youtube-video-details-flow';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

const liveClassSchema = z.object({
  videoUrl: z.string().url('कृपया एक मान्य यूट्यूब URL दर्ज करें।'),
});
type LiveClassFormValues = z.infer<typeof liveClassSchema>;

export default function ScheduleLiveClassPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoDetails, setVideoDetails] = useState<any>(null);

  const form = useForm<LiveClassFormValues>({
    resolver: zodResolver(liveClassSchema),
    defaultValues: {
        videoUrl: '',
    }
  });

  const liveClassesQuery = useMemo(
      () => (firestore ? collection(firestore, 'liveClasses') : null),
      [firestore]
  );
  const { data: liveClasses, isLoading: liveClassesLoading } = useCollection(liveClassesQuery);

  const handleFetchDetails = async () => {
    const videoUrl = form.getValues('videoUrl');
    if (!form.getFieldState('videoUrl').invalid && videoUrl) {
      setIsSubmitting(true);
      try {
        const details = await getYouTubeVideoDetails({ videoUrl });
        setVideoDetails(details);
        toast({ title: 'वीडियो की जानकारी मिल गई!', description: details.title });
      } catch (error: any) {
        console.error(error);
        toast({ variant: 'destructive', title: 'त्रुटि', description: error.message || 'वीडियो की जानकारी लाने में विफल।' });
        setVideoDetails(null);
      } finally {
        setIsSubmitting(false);
      }
    } else {
        toast({ variant: 'destructive', title: 'अमान्य URL', description: 'कृपया पहले एक मान्य यूट्यूब URL दर्ज करें।' });
    }
  };


  const onSubmit = async () => {
    if (!firestore || !videoDetails) {
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'पहले वीडियो की जानकारी प्राप्त करें।' });
        return;
    };

    setIsSubmitting(true);
    
    const liveClassData = {
        youtubeVideoId: videoDetails.videoId,
        teacherName: videoDetails.channelTitle,
        startTime: new Date(videoDetails.scheduledStartTime),
        liveChatId: videoDetails.liveChatId,
        thumbnailUrl: videoDetails.thumbnailUrl,
        title: videoDetails.title,
        status: videoDetails.status, // upcoming, live, or completed
        createdAt: serverTimestamp()
    };

    const liveClassesCollection = collection(firestore, 'liveClasses');
    
    addDoc(liveClassesCollection, liveClassData)
    .then(() => {
        toast({
            title: 'सफलता!',
            description: 'नई लाइव क्लास सफलतापूर्वक शेड्यूल हो गई है।',
        });
        form.reset();
        setVideoDetails(null);
    })
    .catch((error) => {
        const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: liveClassesCollection.path,
            requestResourceData: liveClassData,
        });
        errorEmitter.emit('permission-error', contextualError);
    }).finally(() => {
        setIsSubmitting(false);
    });
  };

  const handleDelete = async (classId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'liveClasses', classId);
    
    deleteDoc(docRef)
      .then(() => {
        toast({ title: 'सफलता', description: 'लाइव क्लास हटा दी गई है।' });
      })
      .catch((error) => {
        const contextualError = new FirestorePermissionError({
          operation: 'delete',
          path: docRef.path,
        });
        errorEmitter.emit('permission-error', contextualError);
      });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>नई लाइव क्लास शेड्यूल करें</CardTitle>
          <CardDescription>
            यूट्यूब वीडियो का लिंक पेस्ट करें और उसकी जानकारी अपने आप लोड हो जाएगी।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <FormField
                    control={form.control}
                    name="videoUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>यूट्यूब वीडियो URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <Button onClick={handleFetchDetails} disabled={isSubmitting} type="button">
                    {isSubmitting && !videoDetails ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                    जानकारी लाएं
                </Button>
              </div>
            </form>
          </Form>

           {videoDetails && (
             <Card className="mt-6 bg-muted/50">
                <CardHeader>
                    <CardTitle>वीडियो की जानकारी</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex gap-4">
                        <Image src={videoDetails.thumbnailUrl} alt={videoDetails.title} width={160} height={90} className="rounded-md" />
                        <div className="space-y-1">
                            <h3 className="font-semibold">{videoDetails.title}</h3>
                            <p className="text-sm text-muted-foreground">{videoDetails.channelTitle}</p>
                            <p className="text-sm text-muted-foreground">{new Date(videoDetails.scheduledStartTime).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Status: {videoDetails.status}</p>
                        </div>
                     </div>
                     <Button onClick={onSubmit} disabled={isSubmitting} className="w-full">
                        {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> शेड्यूल हो रहा है...</> : 'लाइव क्लास शेड्यूल करें'}
                    </Button>
                </CardContent>
             </Card>
           )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>शेड्यूल की गई लाइव क्लासेस</CardTitle>
        </CardHeader>
        <CardContent>
          {liveClassesLoading ? (
            <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>टाइटल</TableHead>
                  <TableHead>शेड्यूल समय</TableHead>
                  <TableHead>स्टेटस</TableHead>
                  <TableHead className="text-right">एक्शन</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveClasses?.map((liveClass) => (
                  <TableRow key={liveClass.id}>
                    <TableCell className="font-medium">{liveClass.title}</TableCell>
                    <TableCell>{liveClass.startTime ? format(liveClass.startTime.toDate(), 'PPpp') : 'N/A'}</TableCell>
                    <TableCell>{liveClass.status}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="ghost" size="icon" disabled>
                            <Edit className="h-4 w-4" />
                       </Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDelete(liveClass.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!liveClassesLoading && liveClasses?.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            कोई लाइव क्लास शेड्यूल नहीं है।
                        </TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
