
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

const courseSchema = z.object({
  name: z.string().min(1, 'नाम आवश्यक है'),
  description: z.string().min(1, 'विवरण आवश्यक है'),
  price: z.coerce.number().min(0, 'कीमत 0 या उससे ज़्यादा होनी चाहिए'),
  isFree: z.boolean().default(false),
  thumbnailUrl: z.string().url('कृपया एक मान्य URL दर्ज करें।').min(1, 'थंबनेल URL आवश्यक है'),
});
type CourseFormValues = z.infer<typeof courseSchema>;

export default function EditCoursePage() {
  const router = useRouter();
  const { courseId } = useParams();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseRef = useMemoFirebase(() => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null), [firestore, courseId]);
  const { data: courseData, isLoading: isCourseLoading } = useDoc(courseRef);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      isFree: false,
      thumbnailUrl: '',
    },
  });

  useEffect(() => {
    if (courseData) {
      form.reset(courseData);
    }
  }, [courseData, form]);

  const thumbnailUrl = form.watch('thumbnailUrl');

  const onSubmit = async (values: CourseFormValues) => {
    if (!firestore || !courseRef) return;
    setIsSubmitting(true);

    try {
      const updatedData = {
        ...values,
        price: values.isFree ? 0 : values.price,
      };
      await updateDoc(courseRef, updatedData);
      
      toast({
          title: 'सफलता!',
          description: 'Course successfully updated.',
      });
      router.push(`/admin/courses`);

    } catch (error: any) {
        console.error("Course update error:", error);
        const contextualError = new FirestorePermissionError({
            operation: 'update',
            path: `courses/${courseId}`,
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update course.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isCourseLoading) {
      return <div className="flex h-full w-full justify-center items-center"><Loader className="animate-spin" /></div>
  }

  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="p-4 border-b flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/admin/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Edit Course</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Course Details</CardTitle>
            <CardDescription>Edit the course information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                      {thumbnailUrl && (
                        <div className="mt-4 w-full aspect-video relative">
                          <Image src={thumbnailUrl} alt="Thumbnail Preview" fill objectFit="cover" className="rounded-md border" />
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Introduction to Programming" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="A brief summary of the course" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (in ₹)</FormLabel>
                    <FormControl><Input type="number" {...field} disabled={form.watch('isFree')} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="isFree" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>This is a Free Course</FormLabel>
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
                )} />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
