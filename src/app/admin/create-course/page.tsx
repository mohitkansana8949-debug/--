
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
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

export default function CreateCoursePage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseForm = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      isFree: false,
      thumbnailUrl: '',
    },
  });

  const thumbnailUrl = courseForm.watch('thumbnailUrl');

  const onSubmit = async (values: CourseFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const courseData = { 
          ...values,
          content: [], // Initialize with empty content
          createdAt: serverTimestamp() 
      };
      
      const coursesCollection = collection(firestore, 'courses');
      
      const docRef = await addDoc(coursesCollection, courseData);
      
      toast({
          title: 'सफलता!',
          description: 'नया कोर्स बना दिया गया है। अब आप कंटेंट जोड़ सकते हैं।',
      });
      router.push(`/admin/content/${docRef.id}`);

    } catch (error: any) {
        console.error("Course creation error:", error);
        const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: 'courses',
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'कोर्स बनाने में एक अप्रत्याशित त्रुटि हुई।' });
        setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            एडमिन डैशबोर्ड पर वापस जाएं
          </Link>
        </Button>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>नया कोर्स बनाएं</CardTitle>
          <CardDescription>कोर्स की जानकारी दर्ज करें। कंटेंट अगले स्टेप में जोड़ा जाएगा।</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={courseForm.control}
                    name="thumbnailUrl"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>थंबनेल इमेज URL</FormLabel>
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

              <FormField control={courseForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>कोर्स का नाम</FormLabel>
                  <FormControl><Input placeholder="जैसे, प्रोग्रामिंग का परिचय" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={courseForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>विवरण</FormLabel>
                  <FormControl><Textarea placeholder="कोर्स का संक्षिप्त सारांश" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={courseForm.control} name="price" render={({ field }) => (
                <FormItem>
                  <FormLabel>कीमत (₹ में)</FormLabel>
                  <FormControl><Input type="number" {...field} disabled={courseForm.watch('isFree')} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={courseForm.control} name="isFree" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>यह एक फ्री कोर्स है</FormLabel>
                    <p className="text-xs text-muted-foreground">
                        अगर यह चालू है, तो कीमत अपने आप 0 हो जाएगी।
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (checked) {
                          courseForm.setValue('price', 0);
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )} />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (<><Loader className="mr-2 h-4 w-4 animate-spin" /> बनाया जा रहा है...</>) : ('सहेजें और कंटेंट जोड़ें')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
