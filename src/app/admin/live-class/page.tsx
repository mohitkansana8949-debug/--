
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
import { Loader, Youtube, Calendar as CalendarIcon, Trash2, Clock } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const getYouTubeID = (url: string): string | null => {
  if (!url) return null;

  let ID = '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      ID = urlObj.pathname.substring(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname === '/watch') {
        ID = urlObj.searchParams.get('v') || '';
      } else if (urlObj.pathname.startsWith('/live/')) {
        ID = urlObj.pathname.split('/live/')[1];
      } else if (urlObj.pathname.startsWith('/embed/')) {
        ID = urlObj.pathname.split('/embed/')[1];
      }
    }
    
    if (ID.includes('?')) {
        ID = ID.split('?')[0];
    }
    return ID || null;

  } catch (e) {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|live\/|v\/|)([\w-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  
  return null;
}

const getLiveChatId = async (videoId: string, apiKey: string) => {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0 && data.items[0].liveStreamingDetails) {
            return data.items[0].liveStreamingDetails.activeLiveChatId;
        }
        return null;
    } catch (error) {
        console.error("Error fetching live chat ID:", error);
        return null;
    }
};


const liveClassSchema = z.object({
  youtubeUrl: z.string().url("कृपया एक मान्य यूट्यूब URL दर्ज करें।").min(5, 'यूट्यूब वीडियो URL आवश्यक है।'),
  teacherName: z.string().min(2, 'टीचर का नाम आवश्यक है।'),
  startTime: z.date({
    required_error: "लाइव क्लास का समय आवश्यक है।",
  }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "कृपया HH:mm फॉर्मेट में सही समय दर्ज करें।"),
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
      time: '12:00',
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

        const [hours, minutes] = values.time.split(':').map(Number);
        const combinedDateTime = new Date(values.startTime);
        combinedDateTime.setHours(hours, minutes, 0, 0);

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
          description: 'नई लाइव क्लास जोड़ दी गई है।',
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>लाइव क्लास की तारीख</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>एक तारीख चुनें</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField control={form.control} name="time" render={({ field }) => (<FormItem> <FormLabel>लाइव क्लास का समय (24-घंटे)</FormLabel> <FormControl> <Input type="time" {...field} /> </FormControl> <FormMessage /> </FormItem>)}/>
              </div>

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
