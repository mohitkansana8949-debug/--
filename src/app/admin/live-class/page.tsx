
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
import { Loader, Youtube, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Function to extract YouTube Video ID from any URL format
const getYouTubeID = (url: string) => {
    let ID = '';
    const urlObj = new URL(url);
    const urlParams = new URLSearchParams(urlObj.search);
    const videoId = urlParams.get('v');

    if (url.includes('youtu.be')) {
        ID = url.substring(url.lastIndexOf('/') + 1);
    } else if (url.includes('/live/')) {
        const parts = url.split('/live/');
        if (parts[1]) {
            ID = parts[1].split('?')[0];
        }
    } else if (videoId) {
        ID = videoId;
    }
    
    // For Shorts or other formats, extract the core ID
    if (ID.includes('?')) {
        ID = ID.split('?')[0];
    }
    
    return ID || null;
}


const liveClassSchema = z.object({
  youtubeUrl: z.string().url("कृपया एक मान्य यूट्यूब URL दर्ज करें।").min(5, 'यूट्यूब वीडियो URL आवश्यक है।'),
  teacherName: z.string().min(2, 'टीचर का नाम आवश्यक है।'),
  startTime: z.date({
    required_error: "लाइव क्लास का समय आवश्यक है।",
  }),
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
    }
  });

  const onSubmit = (values: LiveClassFormValues) => {
    if (!firestore) return;

    const videoId = getYouTubeID(values.youtubeUrl);
    if (!videoId) {
        toast({
            variant: 'destructive',
            title: 'गलत URL',
            description: 'इस URL से वीडियो ID नहीं मिल सका। कृपया सही यूट्यूब URL दर्ज करें।'
        });
        return;
    }

    setIsSubmitting(true);
    const liveClassesCollection = collection(firestore, 'liveClasses');
    const liveClassData = {
      youtubeVideoId: videoId,
      teacherName: values.teacherName,
      startTime: Timestamp.fromDate(values.startTime),
      createdAt: serverTimestamp(),
    };

    addDoc(liveClassesCollection, liveClassData)
      .then(() => {
        toast({
          title: 'सफलता!',
          description: 'नई लाइव क्लास जोड़ दी गई है।',
        });
        form.reset();
      })
      .catch((error) => {
        const contextualError = new FirestorePermissionError({
          operation: 'create',
          path: liveClassesCollection.path,
          requestResourceData: liveClassData,
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
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
              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>यूट्यूब वीडियो URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teacherName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>टीचर का नाम</FormLabel>
                    <FormControl>
                      <Input placeholder="जैसे, मोहित सर" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>लाइव क्लास का समय</FormLabel>
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <><Loader className="mr-2 h-4 w-4 animate-spin" /> सेव हो रहा है...</>
                ) : (
                  'लाइव क्लास सेव करें'
                )}
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
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
