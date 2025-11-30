
'use client';
import { useState } from 'react';
import { useCollection, useMemoFirebase, useFirebase, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader, UserPlus, PlusCircle, Trash2, MessageSquare } from 'lucide-react';
import Image from 'next/image';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const postSchema = z.object({
    text: z.string().min(1, 'कुछ टेक्स्ट लिखें।'),
    imageUrl: z.string().url('कृपया एक मान्य URL दर्ज करें।').optional().or(z.literal('')),
});
type PostFormValues = z.infer<typeof postSchema>;

export default function AdminPostsPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);

    const postsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'posts'), orderBy('createdAt', 'desc')) : null), [firestore]);
    const { data: posts, isLoading: postsLoading } = useCollection(postsQuery);

    const postForm = useForm<PostFormValues>({ resolver: zodResolver(postSchema), defaultValues: { text: '', imageUrl: '' } });

    const onPostSubmit = (values: PostFormValues) => {
      if (!firestore || !user) return;

      setIsSubmitting(true);
      const postsCollection = collection(firestore, 'posts');
      const postData = {
          ...values,
          userId: user.uid,
          userName: user.displayName,
          userImage: user.photoURL,
          likeCount: 0,
          commentCount: 0,
          createdAt: serverTimestamp()
      };

      addDoc(postsCollection, postData)
        .then(() => {
          toast({ title: 'सफलता!', description: 'नई पोस्ट बना दी गई है।'});
          postForm.reset();
          setIsPostDialogOpen(false);
        })
        .catch((error) => {
          const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: 'posts',
            requestResourceData: postData
          });
          errorEmitter.emit('permission-error', contextualError);
          toast({ variant: "destructive", title: "Error", description: "Failed to create post." });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    };
    
    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'posts', id));
            toast({ title: "Success", description: "Post deleted successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete post." });
            console.error("Error deleting post:", error);
        }
    };


    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Manage Posts</CardTitle>
                    <CardDescription>Create and delete posts for the user feed.</CardDescription>
                </div>
                 <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
                    <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" />Create Post</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader><DialogTitle>Create a New Post</DialogTitle></DialogHeader>
                        <Form {...postForm}>
                        <form onSubmit={postForm.handleSubmit(onPostSubmit)} className="space-y-4">
                            <FormField control={postForm.control} name="text" render={({ field }) => (<FormItem><FormLabel>Post Text</FormLabel><FormControl><Textarea placeholder="What's on your mind?" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={postForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl><FormMessage /></FormItem>)}/>

                            <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Posting...</> : 'Create Post'}</Button>
                        </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
             <CardContent>
                {postsLoading ? <div className="flex justify-center p-8"><Loader className="animate-spin"/></div> :
                posts && posts.length > 0 ? (
                    <div className="space-y-4">
                        {posts.map(post => (
                        <Card key={post.id}>
                            <CardContent className="p-4 flex gap-4">
                                {post.imageUrl && <Image src={post.imageUrl} alt="Post image" width={100} height={100} className="rounded-md object-cover" />}
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm line-clamp-3">{post.text}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(post.createdAt?.toDate()).toLocaleString()}</p>
                                </div>
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This action cannot be undone. This will permanently delete this post.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(post.id)}>Continue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground p-8">
                      <MessageSquare className="mx-auto h-12 w-12" />
                      <p className="mt-4">No posts found.</p>
                    </div>
                )
                }
            </CardContent>
        </Card>
    );
}
