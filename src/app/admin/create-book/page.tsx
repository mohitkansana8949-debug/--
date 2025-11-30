
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
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader, ArrowLeft } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';

const bookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  offer: z.string().optional(),
  imageUrl: z.string().url('Please enter a valid URL.').min(1, 'Image URL is required'),
});
type BookFormValues = z.infer<typeof bookSchema>;

export default function CreateBookPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      offer: '',
      imageUrl: '',
    },
  });

  const imageUrl = form.watch('imageUrl');

  const onSubmit = async (values: BookFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const bookData = { 
          ...values,
          createdAt: serverTimestamp() 
      };
      
      const booksCollection = collection(firestore, 'books');
      await addDoc(booksCollection, bookData);
      
      toast({
          title: 'Success!',
          description: 'New book has been added to Bookshala.',
      });
      router.push(`/admin/books`);

    } catch (error: any) {
        console.error("Book creation error:", error);
        const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: 'books',
            requestResourceData: values,
        });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred while creating the book.' });
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
        <h1 className="text-xl font-semibold">Add New Book</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Book Details</CardTitle>
            <CardDescription>Enter the details for the new book.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book Name</FormLabel>
                      <FormControl><Input placeholder="e.g., The Psychology of Money" {...field} /></FormControl>
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
                      <FormControl><Textarea placeholder="A brief summary of the book" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Book Image URL</FormLabel>
                      <FormControl><Input placeholder="https://example.com/image.jpg" {...field} /></FormControl>
                      <FormMessage />
                      {imageUrl && (
                        <div className="mt-4 w-full aspect-[3/4] relative max-w-xs mx-auto">
                          <Image src={imageUrl} alt="Book Preview" fill objectFit="contain" className="rounded-md border" />
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Price (in ₹)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="offer"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Offer Tag (Optional)</FormLabel>
                        <FormControl><Input placeholder="e.g., Best Seller" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Save Book'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
