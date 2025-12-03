
'use client';
import { useState } from 'react';
import { useCollection, useMemoFirebase, useFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, deleteDoc, query } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader, UserPlus, Trash2, Trophy } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

const topperSchema = z.object({
    name: z.string().min(1, 'नाम आवश्यक है'),
    achievement: z.string().min(1, 'उपलब्धि आवश्यक है'),
    imageUrl: z.string().url('कृपया एक मान्य URL दर्ज करें।').min(1, 'फोटो URL आवश्यक है'),
});
type TopperFormValues = z.infer<typeof topperSchema>;

export default function AdminToppersPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTopperDialogOpen, setIsTopperDialogOpen] = useState(false);

    const toppersQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'toppers')) : null), [firestore]);
    const { data: toppers, isLoading: toppersLoading } = useCollection(toppersQuery);

    const topperForm = useForm<TopperFormValues>({ resolver: zodResolver(topperSchema), defaultValues: { name: '', achievement: '', imageUrl: '' } });

    const onTopperSubmit = (values: TopperFormValues) => {
      if (!firestore) return;

      setIsSubmitting(true);
      const toppersCollection = collection(firestore, 'toppers');
      const docRef = doc(toppersCollection);
      const topperData = { 
          ...values, 
          createdAt: serverTimestamp() 
      };

      setDoc(docRef, topperData)
        .then(() => {
          toast({ title: 'सफलता!', description: 'नए टॉपर को जोड़ दिया गया है।'});
          topperForm.reset();
          setIsTopperDialogOpen(false);
        })
        .catch((error) => {
          const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: docRef.path,
            requestResourceData: topperData
          });
          errorEmitter.emit('permission-error', contextualError);
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    };

    const handleDeleteTopper = async (topperId: string) => {
      if (!firestore) return;

      try {
        await deleteDoc(doc(firestore, 'toppers', topperId));
        toast({ title: "Success", description: "Topper has been deleted." });
      } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to delete topper." });
        console.error("Error deleting topper:", error);
      }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <div>
                    <CardTitle>Manage Toppers</CardTitle>
                    <CardDescription>Add, view, and remove toppers from the homepage.</CardDescription>
                </div>
                 <Dialog open={isTopperDialogOpen} onOpenChange={setIsTopperDialogOpen}>
                    <DialogTrigger asChild><Button><Trophy className="mr-2 h-4 w-4" />Add New Topper</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader><DialogTitle>Add New Topper</DialogTitle></DialogHeader>
                        <Form {...topperForm}>
                        <form onSubmit={topperForm.handleSubmit(onTopperSubmit)} className="space-y-4">
                            <FormField control={topperForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Topper's Name</FormLabel><FormControl><Input placeholder="e.g., Rahul Sharma" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={topperForm.control} name="achievement" render={({ field }) => (<FormItem><FormLabel>Achievement / Rank</FormLabel><FormControl><Input placeholder="e.g., Rank 1 - Sainik School" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={topperForm.control} name="imageUrl" render={({ field }) => (<FormItem><FormLabel>Photo URL</FormLabel><FormControl><Input placeholder="https://example.com/photo.jpg" {...field} /></FormControl><FormMessage /></FormItem>)}/>

                            <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Topper'}</Button>
                        </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
             <CardContent>{toppersLoading ? <div className="flex justify-center p-8"><Loader className="animate-spin"/></div> : (
             toppers && toppers.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {toppers.map(topper => (
                    <Card key={topper.id} className="text-center group relative">
                        {topper.imageUrl && <Image src={topper.imageUrl} alt={topper.name} width={200} height={200} className="w-full h-40 object-cover rounded-t-lg"/>}
                        <CardHeader className="p-4"><CardTitle className="text-base">{topper.name}</CardTitle></CardHeader>
                        <CardContent className="p-4 pt-0"><p className="text-sm text-muted-foreground">{topper.achievement}</p></CardContent>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the topper "{topper.name}".</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTopper(topper.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </Card>
                ))}
             </div>
             ) : (
                <div className="text-center text-muted-foreground p-8 border rounded-lg">
                    <Trophy className="mx-auto h-12 w-12"/>
                    <p className="mt-4 font-semibold">No Toppers Added Yet</p>
                    <p className="text-sm">Click "Add New Topper" to feature your first student.</p>
                </div>
             )
             )}</CardContent>
        </Card>
    );
}
