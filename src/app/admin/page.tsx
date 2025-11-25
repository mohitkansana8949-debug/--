'use client';

import { useMemo, useState } from 'react';
import { useCollection } from '@/firebase';
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
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const usersQuery = useMemo(
    () => collection(firestore, 'users'),
    [firestore]
  );
  const coursesQuery = useMemo(
    () => collection(firestore, 'courses'),
    [firestore]
  );
  const enrollmentsQuery = useMemo(
    () => collection(firestore, 'courseEnrollments'),
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
    },
  });

  const onSubmit = async (values: CourseFormValues) => {
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
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, courses, and enrollments.
          </p>
        </div>
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Intro to Programming" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A brief summary of the course" {...field} />
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
                      <FormLabel>Thumbnail URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://picsum.photos/seed/..." {...field} />
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
                      <FormLabel>Price</FormLabel>
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
                            <FormLabel>Free Course</FormLabel>
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
                      Creating...
                    </>
                  ) : (
                    'Create Course'
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
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Loader className="animate-spin"/> : (
              <>
                <div className="text-2xl font-bold">{users?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total registered users
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader className="animate-spin"/> : (
              <>
                <div className="text-2xl font-bold">{courses?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total courses available
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? <Loader className="animate-spin"/> : (
              <>
                <div className="text-2xl font-bold">{enrollments?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total active enrollments
                </p>
              </>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
