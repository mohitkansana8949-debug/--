
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader, ArrowLeft } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';

const pyqSchema = z.object({
  name: z.string().min(1, 'नाम आवश्यक है'),
  description: z.string().min(1, 'विवरण आवश्यक है'),
  price: z.coerce.number().min(0, 'कीमत 0 या उससे ज़्यादा होनी चाहिए'),
  isFree: z.boolean().default(false),
  pdfUrl: z.string().url('कृपया एक मान्य PDF URL दर्ज करें।').min(1, 'PDF URL आवश्यक है'),
  thumbnailUrl: z.string().url('कृपया एक मान्य URL दर्ज करें।').optional().or(z.literal('')),
});
type PYQFormValues = z.infer<typeof pyqSchema>;

export default function EditPYQPage() {
  const router = useRouter();
  const { pyqId } = useParams();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pyqRef = useMemoFirebase(() => (firestore && pyqId ? doc(firestore, 'pyqs', pyqId as string) : null), [firestore, pyqId]);
  const { data: pyqData, isLoading: isPyqLoading } = useDoc(pyqRef);

  const form = useForm<PYQFormValues>({
    resolver: zodResolver(pyqSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      isFree: false,
      pdfUrl: '',
      thumbnailUrl: '',
    },
  });

  useEffect(() => {
    if (pyqData) {
      form.reset(pyqData);
    }
  }, [pyqData, form]);

  const thumbnailUrl = form.watch('thumbnailUrl');

  const onSubmit = async (values: PYQFormValues) => {
    if (!firestore || !pyqRef) return;
    setIsSubmitting(true);

    try {
      await updateDoc(pyqRef, values);
      
      toast({
          title: 'सफलता!',
          description: 'PYQ सफलतापूर्वक अपडेट हो गया है।',
      });
      router.push(`/admin/pyqs`);

    } catch (error: any) {
        console.error("PYQ update error:", error);
        const contextualError = new FirestorePermissionError({
            operation: 'update',
            path: `pyqs/${pyqId}`,
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'PYQ अपडेट करने में एक अप्रत्याशित त्रुटि हुई।' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isPyqLoading) {
      return <div className="flex h-full w-full justify-center items-center"><Loader className="animate-spin" /></div>
  }

  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="p-4 border-b flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/admin/pyqs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to PYQs
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Edit PYQ</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>PYQ Details</CardTitle>
            <CardDescription>Edit the Previous Year Question Paper information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PYQ Name</FormLabel>
                      <FormControl><Input placeholder="e.g., UPSC Prelims 2023" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea placeholder="A brief summary of the PYQ" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pdfUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PDF URL</FormLabel>
                      <FormControl><Input placeholder="https://example.com/pyq.pdf" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail Image URL (Optional)</FormLabel>
                      <FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl>
                      <FormMessage />
                      {thumbnailUrl && (
                        <div className="mt-4 w-full aspect-video relative">
                          <Image src={thumbnailUrl} alt="Thumbnail Preview" fill objectFit="cover" className="rounded-md border" />
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (in ₹)</FormLabel>
                      <FormControl><Input type="number" {...field} disabled={form.watch('isFree')} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFree"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>This is a Free PYQ</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          If enabled, the price will automatically be set to 0.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (checked) {
                              form.setValue('price', 0);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
