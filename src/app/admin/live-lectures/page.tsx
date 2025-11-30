
'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader, ArrowLeft, Wand2 } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { getYouTubeID } from '@/lib/youtube';
import { Skeleton } from '@/components/ui/skeleton';

const lectureSchema = z.object({
  youtubeUrl: z.string().url('Please enter a valid YouTube URL.'),
});

type LectureFormValues = z.infer<typeof lectureSchema>;

type FetchedDetails = {
    title: string;
    thumbnailUrl: string;
    videoId: string;
};

export default function AddLiveLecturePage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedDetails, setFetchedDetails] = useState<FetchedDetails | null>(null);

  const form = useForm<LectureFormValues>({
    resolver: zodResolver(lectureSchema),
    defaultValues: {
      youtubeUrl: '',
    },
  });

  const youtubeUrl = useWatch({ control: form.control, name: 'youtubeUrl' });
  const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  const handleFetchDetails = async () => {
    if (!youtubeUrl) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a YouTube URL first.' });
      return;
    }
    const videoId = getYouTubeID(youtubeUrl);
    if (!videoId) {
      toast({ variant: 'destructive', title: 'Invalid URL', description: 'Could not extract Video ID from the URL.' });
      return;
    }

    if (!youtubeApiKey) {
      toast({ variant: 'destructive', title: 'API Key Missing', description: 'YouTube API key is not configured.' });
      console.error("YOUTUBE_API_KEY is not set in environment variables.");
      return;
    }

    setIsFetching(true);
    setFetchedDetails(null);
    try {
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`;
      const response = await fetch(detailsUrl);
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch video details from YouTube API.');
      }

      if (data.items && data.items.length > 0) {
        const snippet = data.items[0].snippet;
        setFetchedDetails({
            title: snippet.title,
            thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
            videoId: videoId
        });
      } else {
        throw new Error('Video not found on YouTube.');
      }

    } catch (error: any) {
        console.error("Fetch error:", error);
        toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not fetch video details. Please check the URL and try again.' });
    } finally {
        setIsFetching(false);
    }
  };
  
  const onSubmit = async () => {
    if (!firestore || !fetchedDetails) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please fetch video details before submitting.' });
        return;
    };

    setIsSubmitting(true);

    try {
      const lectureData = { 
          title: fetchedDetails.title,
          thumbnailUrl: fetchedDetails.thumbnailUrl,
          videoId: fetchedDetails.videoId,
          youtubeUrl: youtubeUrl,
          isLive: true, // All new lectures are initially live
          createdAt: serverTimestamp() 
      };
      
      const lecturesCollection = collection(firestore, 'liveLectures');
      
      await addDoc(lecturesCollection, lectureData);
      
      toast({
          title: 'सफलता!',
          description: 'नया लाइव लेक्चर जोड़ दिया गया है।',
      });
      // Reset form
      form.reset();
      setFetchedDetails(null);

    } catch (error: any) {
        console.error("Lecture creation error:", error);
        const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: 'liveLectures',
            requestResourceData: fetchedDetails,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'लेक्चर बनाने में एक अप्रत्याशित त्रुटि हुई।' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="p-4 border-b flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Add New Live Lecture</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Live Lecture Details</CardTitle>
            <CardDescription>Paste a YouTube Live URL, fetch details automatically, and add it to the app.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Live URL</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                        </FormControl>
                        <Button type="button" onClick={handleFetchDetails} disabled={isFetching || !youtubeUrl}>
                            {isFetching ? <Loader className="animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            Fetch Details
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {isFetching && (
                    <div className="space-y-2">
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                    </div>
                )}
                
                {fetchedDetails && (
                    <Card className="bg-muted/50 animate-in fade-in-50">
                        <CardHeader>
                            <CardTitle className="text-lg">Fetched Details (Preview)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="w-full aspect-video relative">
                             <Image src={fetchedDetails.thumbnailUrl} alt="Thumbnail Preview" fill objectFit="cover" className="rounded-md border" />
                           </div>
                           <p className="font-semibold">{fetchedDetails.title}</p>
                           <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? (<><Loader className="mr-2 h-4 w-4 animate-spin" /> Adding...</>) : ('Add Live Lecture')}
                           </Button>
                        </CardContent>
                    </Card>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
