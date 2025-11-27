
'use client';
import { useState } from 'react';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Loader, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

const educatorSchema = z.object({
    name: z.string().min(1, 'नाम आवश्यक है'),
    experience: z.string().min(1, 'अनुभव आवश्यक है'),
});
type EducatorFormValues = z.infer<typeof educatorSchema>;

export default function AdminEducatorsPage() {
    const { firestore, storage } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEducatorDialogOpen, setIsEducatorDialogOpen] = useState(false);
    const [educatorPhoto, setEducatorPhoto] = useState<File | null>(null);

    const educatorsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'educators') : null), [firestore]);
    const { data: educators, isLoading: educatorsLoading } = useCollection(educatorsQuery);

    const educatorForm = useForm<EducatorFormValues>({ resolver: zodResolver(educatorSchema), defaultValues: { name: '', experience: '' } });

    const onEducatorSubmit = async (values: EducatorFormValues) => {
      if (!firestore || !storage) return;
      if (!educatorPhoto) {
          toast({ variant: 'destructive', title: 'फोटो आवश्यक है', description: 'कृपया एक फोटो अपलोड करें।'});
          return;
      }

      setIsSubmitting(true);
      try {
        const docRef = doc(collection(firestore, 'educators'));
        const storageRef = ref(storage, `educator_photos/${docRef.id}`);
        await uploadBytes(storageRef, educatorPhoto);
        const imageUrl = await getDownloadURL(storageRef);

        const educatorData = { ...values, imageUrl, createdAt: serverTimestamp() };

        await setDoc(docRef, educatorData);
        toast({ title: 'सफलता!', description: 'नए एजुकेटर को जोड़ दिया गया है।'});
        educatorForm.reset();
        setEducatorPhoto(null);
        setIsEducatorDialogOpen(false);
      } catch (error: any) {
        console.error("Educator creation error:", error);
        const contextualError = new FirestorePermissionError({ operation: 'create', path: 'educators', requestResourceData: values });
        errorEmitter.emit('permission-error', contextualError);
        toast({ variant: 'destructive', title: 'त्रुटि', description: error.message || 'एजुकेटर बनाने में विफल।'});
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>एजुकेटर्स</CardTitle>
                 <Dialog open={isEducatorDialogOpen} onOpenChange={setIsEducatorDialogOpen}>
                    <DialogTrigger asChild><Button><UserPlus className="mr-2 h-4 w-4" />नया एजुकेटर जोड़ें</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader><DialogTitle>नया एजुकेटर जोड़ें</DialogTitle></DialogHeader>
                        <Form {...educatorForm}>
                        <form onSubmit={educatorForm.handleSubmit(onEducatorSubmit)} className="space-y-4">
                            <FormField control={educatorForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>एजुकेटर का नाम</FormLabel><FormControl><Input placeholder="जैसे, राहुल शर्मा" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                            <FormField control={educatorForm.control} name="experience" render={({ field }) => (<FormItem><FormLabel>अनुभव</FormLabel><FormControl><Input placeholder="जैसे, 5+ साल वेब डेवलपमेंट में" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                             <FormItem>
                                <FormLabel>फोटो</FormLabel>
                                <FormControl><Input type="file" accept="image/*" onChange={(e) => setEducatorPhoto(e.target.files ? e.target.files[0] : null)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> जोड़ा जा रहा है...</> : 'एजुकेटर जोड़ें'}</Button>
                        </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
             <CardContent>{educatorsLoading ? <div className="flex justify-center p-8"><Loader className="animate-spin"/></div> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{educators?.map(educator => (<Card key={educator.id} className="text-center">{educator.imageUrl && <Image src={educator.imageUrl} alt={educator.name} width={200} height={200} className="w-full h-40 object-cover rounded-t-lg"/>}<CardHeader className="p-4"><CardTitle className="text-base">{educator.name}</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="text-sm text-muted-foreground">{educator.experience}</p></CardContent></Card>))}</div>}</CardContent>
        </Card>
    );
}
