
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader, ArrowLeft } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Link from 'next/link';

const testSchema = z.object({
  name: z.string().min(1, 'नाम आवश्यक है'),
  description: z.string().min(1, 'विवरण आवश्यक है'),
  duration: z.coerce.number().min(1, 'अवधि कम से कम 1 मिनट होनी चाहिए'),
  price: z.coerce.number().min(0, 'कीमत 0 या उससे ज़्यादा होनी चाहिए'),
  isFree: z.boolean().default(false),
  questions: z.string().min(1, 'कृपया JSON प्रारूप में प्रश्न दर्ज करें।').refine(val => {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }, { message: 'JSON अमान्य है या यह एक खाली ऐरे (array) है।' }),
});

type TestFormValues = z.infer<typeof testSchema>;

const jsonExample = `[
  {
    "question": "भारत की राजधानी क्या है?",
    "options": [
      "मुंबई",
      "नई दिल्ली",
      "कोलकाता",
      "चेन्नई"
    ],
    "answer": "नई दिल्ली"
  },
  {
    "question": "सूर्य किस दिशा में उगता है?",
    "options": [
      "पूर्व",
      "पश्चिम",
      "उत्तर",
      "दक्षिण"
    ],
    "answer": "पूर्व"
  }
]`;

export default function CreateTestPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TestFormValues>({
    resolver: zodResolver(testSchema),
    defaultValues: {
      name: '',
      description: '',
      duration: 30,
      price: 0,
      isFree: false,
      questions: '',
    },
  });

  const onSubmit = async (values: TestFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const testData = {
        name: values.name,
        description: values.description,
        duration: values.duration,
        price: values.isFree ? 0 : values.price,
        isFree: values.isFree,
        questions: JSON.parse(values.questions),
        createdAt: serverTimestamp(),
      };
      
      const testsCollection = collection(firestore, 'tests');
      
      await addDoc(testsCollection, testData);
      
      toast({
          title: 'सफलता!',
          description: 'नई टेस्ट सीरीज़ बना दी गई है।',
      });
      router.push(`/admin/test-series`);

    } catch (error: any) {
        console.error("Test creation error:", error);
        const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: 'tests',
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'टेस्ट सीरीज़ बनाने में एक अप्रत्याशित त्रुटि हुई।' });
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
        <h1 className="text-xl font-semibold">Create New Test Series</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Test Series Details</CardTitle>
            <CardDescription>Enter the test series information.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Test Name</FormLabel><FormControl><Input placeholder="e.g., General Knowledge Test" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A brief summary of the test" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="duration" render={({ field }) => (
                  <FormItem><FormLabel>Duration (in minutes)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="questions" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Questions (JSON format)</FormLabel>
                    <FormControl><Textarea placeholder={jsonExample} {...field} rows={15} /></FormControl>
                    <FormDescription>Please provide questions in a valid JSON array format.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem><FormLabel>Price (in ₹)</FormLabel><FormControl><Input type="number" {...field} disabled={form.watch('isFree')} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="isFree" render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5"><FormLabel>This is a Free Test</FormLabel><p className="text-xs text-muted-foreground">If enabled, the price will automatically be set to 0.</p></div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (checked) { form.setValue('price', 0); }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )} />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Save Test Series'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
