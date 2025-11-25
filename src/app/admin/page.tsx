'use client';

import { useState } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  BookOpen,
  CreditCard,
  PlusCircle,
  Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

const courseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  thumbnailUrl: z.string().url('Must be a valid URL'),
  isFree: z.boolean().default(false),
  content: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const coursesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'courses') : null),
    [firestore]
  );
  const enrollmentsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'courseEnrollments') : null),
    [firestore]
  );

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      thumbnailUrl: '',
      isFree: false,
      content: '',
    },
  });

  const onSubmit = async (values: CourseFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'courses'), {
        ...values,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Success!',
        description: 'New course has been created.',
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not create the course. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = usersLoading || coursesLoading || enrollmentsLoading;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">एडमिन डैशबोर्ड</h1>
          <p className="text-muted-foreground">
            यूज़र, कोर्स और एनरोलमेंट मैनेज करें।
          </p>
        </div>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              नया कोर्स बनाएं
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>नया कोर्स बनाएं</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>कोर्स का नाम</FormLabel>
                      <FormControl>
                        <Input placeholder="जैसे, प्रोग्रामिंग का परिचय" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>विवरण</FormLabel>
                      <FormControl>
                        <Textarea placeholder="कोर्स का संक्षिप्त सारांश" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="thumbnailUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>थंबनेल URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://picsum.photos/seed/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>कंटेंट</FormLabel>
                      <FormControl>
                        <Textarea placeholder="कोर्स कंटेंट (जैसे, वीडियो लिंक, टेक्स्ट)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>कीमत</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={form.watch('isFree')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                            <FormLabel>फ्री कोर्स</FormLabel>
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
                  {isSubmitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      बनाया जा रहा है...
                    </>
                  ) : (
                    'कोर्स बनाएं'
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">यूज़र्स</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader className="animate-spin"/> : (
              <>
                <div className="text-2xl font-bold">{users?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  कुल रजिस्टर्ड यूज़र्स
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">कोर्सेस</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader className="animate-spin"/> : (
              <>
                <div className="text-2xl font-bold">{courses?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  कुल उपलब्ध कोर्सेस
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">एनरोलमेंट्स</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader className="animate-spin"/> : (
              <>
                <div className="text-2xl font-bold">{enrollments?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  कुल एक्टिव एनरोलमेंट्स
                </p>
              </>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
