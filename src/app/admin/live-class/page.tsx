
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Loader, Youtube, Trash2 } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { getLiveChatId, getYouTubeID } from '@/lib/youtube';


const liveClassSchema = z.object({
  youtubeUrl: z.string().url("कृपया एक मान्य यूट्यूब URL दर्ज करें।").min(5, 'यूट्यूब वीडियो URL आवश्यक है।'),
  teacherName: z.string().min(2, 'टीचर का नाम आवश्यक है।'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "कृपया YYYY-MM-DD फॉर्मेट में तारीख दर्ज करें।"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "कृपया HH:mm फॉर्मेट में सही समय दर्ज करें।"),
});
type LiveClassFormValues = z.infer<typeof liveClassSchema>;

export default function ManageLiveClassPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const liveClassesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'liveClasses') : null),
    [firestore]
  );
  const { data: liveClasses, isLoading: liveClassesLoading } = useCollection(liveClassesQuery);

  const form = useForm<LiveClassFormValues>({
    resolver: zodResolver(liveClassSchema),
    defaultValues: {
      youtubeUrl: '',
      teacherName: '',
      startDate: '',
      startTime: '12:00',
    }
  });

  const onSubmit = async (values: LiveClassFormValues) => {
    if (!firestore) return;
    
    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'YouTube API की कॉन्फ़िगर नहीं है।'});
        return;
    }

    const videoId = getYouTubeID(values.youtubeUrl);
    if (!videoId) {
        toast({ variant: 'destructive', title: 'गलत URL', description: 'इस URL से वीडियो ID नहीं मिल सका।'});
        return;
    }

    setIsSubmitting(true);
    
    try {
        const liveChatId = await getLiveChatId(videoId, apiKey);

        const combinedDateTime = new Date(`${values.startDate}T${values.startTime}:00`);
        if (isNaN(combinedDateTime.getTime())) {
            toast({ variant: 'destructive', title: 'गलत तारीख/समय', description: 'कृपया सही तारीख और समय फॉर्मेट का उपयोग करें।'});
            setIsSubmitting(false);
            return;
        }


        const liveClassesCollection = collection(firestore, 'liveClasses');
        const liveClassData = {
          youtubeVideoId: videoId,
          liveChatId: liveChatId,
          teacherName: values.teacherName,
          startTime: Timestamp.fromDate(combinedDateTime),
          createdAt: serverTimestamp(),
        };

        await addDoc(liveClassesCollection, liveClassData);
        toast({
          title: 'सफलता!',
          description: 'नई लाइव क्लास जोड़ दी गई है।',
        });
        form.reset();

    } catch (error: any) {
        console.error("Error creating live class:", error);
        const contextualError = new FirestorePermissionError({
          operation: 'create',
          path: 'liveClasses',
          requestResourceData: {}, // data is dynamic, cannot construct here fully
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'त्रुटि', description: error.message || 'क्लास बनाने में विफल।'});
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>नई लाइव क्लास जोड़ें</CardTitle>
          <CardDescription>यहां से यूट्यूब लाइव क्लास की जानकारी जोड़ें।</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="youtubeUrl" render={({ field }) => ( <FormItem> <FormLabel>यूट्यूब वीडियो URL</FormLabel> <FormControl> <Input placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="teacherName" render={({ field }) => ( <FormItem> <FormLabel>टीचर का नाम</FormLabel> <FormControl> <Input placeholder="जैसे, मोहित सर" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
              
              <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>लाइव क्लास की तारीख</FormLabel>
                      <FormControl>
                        <Input type="text" placeholder="YYYY-MM-DD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
              />
              <FormField 
                  control={form.control} 
                  name="startTime" 
                  render={({ field }) => (
                      <FormItem> 
                          <FormLabel>लाइव क्लास का समय</FormLabel> 
                          <FormControl> 
                              <Input type="text" placeholder="HH:mm" {...field} /> 
                          </FormControl> 
                          <FormMessage /> 
                      </FormItem>
                  )}
              />

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> सेव हो रहा है...</> : 'लाइव क्लास सेव करें'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>शेड्यूल की गई लाइव क्लासेस</CardTitle>
        </CardHeader>
        <CardContent>
          {liveClassesLoading ? (
             <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>टीचर</TableHead>
                        <TableHead>वीडियो ID</TableHead>
                        <TableHead>समय</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {liveClasses?.map(lc => (
                        <TableRow key={lc.id}>
                            <TableCell>{lc.teacherName}</TableCell>
                            <TableCell className="font-mono">{lc.youtubeVideoId}</TableCell>
                            <TableCell>{lc.startTime ? format(lc.startTime.toDate(), 'PPp') : 'N/A'}</TableCell>
                        </TableRow>
                    ))}
                     {!liveClassesLoading && liveClasses?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
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
