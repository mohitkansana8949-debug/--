
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
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader, ArrowLeft } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Link from 'next/link';

const resultSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  examName: z.string().min(1, 'Exam name is required'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  mobile: z.string().length(10, 'Mobile number must be 10 digits'),
});

type ResultFormValues = z.infer<typeof resultSchema>;

export default function SubmitResultPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResultFormValues>({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      name: user?.displayName || '',
      examName: '',
      rollNumber: '',
      mobile: '',
    },
  });

  const onSubmit = async (values: ResultFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const resultData = { 
          ...values,
          userId: user?.uid || null,
          submittedAt: serverTimestamp() 
      };
      
      const resultsCollection = collection(firestore, 'results');
      await addDoc(resultsCollection, resultData);
      
      toast({
          title: 'Success!',
          description: 'Your result has been submitted for review. Thank you!',
      });
      router.push('/');

    } catch (error: any) {
        console.error("Result submission error:", error);
        const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: 'results',
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="p-4 border-b flex items-center gap-4 sticky top-0 bg-background z-10">
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Submit Your Success Story</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Share Your Achievement</CardTitle>
            <CardDescription>If you have cleared any exam with our help, please share your details. We'd love to feature you!</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="Your full name" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="examName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Exam Name</FormLabel>
                        <FormControl><Input placeholder="e.g., UPSC, Sainik School" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="rollNumber" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Roll Number</FormLabel>
                        <FormControl><Input placeholder="Your exam roll number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="mobile" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl><Input type="tel" maxLength={10} placeholder="Your 10-digit mobile number" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Submit My Result'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
