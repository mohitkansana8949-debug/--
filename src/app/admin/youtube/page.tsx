
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
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader, Youtube, Trash2 } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const youtubeChannelSchema = z.object({
  channelUrl: z.string().url("कृपया एक मान्य यूट्यूब चैनल URL दर्ज करें।"),
  coverImageUrl: z.string().url("कृपया एक मान्य कवर इमेज URL दर्ज करें।"),
});
type YouTubeChannelFormValues = z.infer<typeof youtubeChannelSchema>;

export default function ManageYouTubePage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const channelsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'youtubeChannels') : null),
    [firestore]
  );
  const { data: channels, isLoading: channelsLoading } = useCollection(channelsQuery);

  const form = useForm<YouTubeChannelFormValues>({
    resolver: zodResolver(youtubeChannelSchema),
  });

  const onSubmit = (values: YouTubeChannelFormValues) => {
    if (!firestore) return;

    setIsSubmitting(true);
    const channelsCollection = collection(firestore, 'youtubeChannels');
    const channelData = {
      ...values,
      createdAt: serverTimestamp(),
    };

    addDoc(channelsCollection, channelData)
      .then(() => {
        toast({
          title: 'सफलता!',
          description: 'नया यूट्यूब चैनल जोड़ दिया गया है।',
        });
        form.reset();
      })
      .catch((error) => {
        const contextualError = new FirestorePermissionError({
          operation: 'create',
          path: channelsCollection.path,
          requestResourceData: channelData,
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
          <CardTitle>नया यूट्यूब चैनल जोड़ें</CardTitle>
          <CardDescription>ऐप में दिखाने के लिए यहां यूट्यूब चैनल की जानकारी जोड़ें।</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="channelUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>यूट्यूब चैनल URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.youtube.com/c/YourChannel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coverImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>कवर इमेज URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/cover.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <><Loader className="mr-2 h-4 w-4 animate-spin" /> सेव हो रहा है...</>
                ) : (
                  'चैनल सेव करें'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>जोड़े गए चैनल्स</CardTitle>
        </CardHeader>
        <CardContent>
          {channelsLoading ? (
             <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>चैनल URL</TableHead>
                        <TableHead>कवर इमेज</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {channels?.map(channel => (
                        <TableRow key={channel.id}>
                            <TableCell className="font-mono truncate max-w-xs">
                                <a href={channel.channelUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{channel.channelUrl}</a>
                            </TableCell>
                            <TableCell className="font-mono truncate max-w-xs">
                                <a href={channel.coverImageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">{channel.coverImageUrl}</a>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!channelsLoading && channels?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                                कोई चैनल नहीं मिला।
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
