
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  BookOpen,
  CreditCard,
  PlusCircle,
  Loader,
  Settings,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const educatorSchema = z.object({
    name: z.string().min(1, 'नाम आवश्यक है'),
    experience: z.string().min(1, 'अनुभव आवश्यक है'),
});
type EducatorFormValues = z.infer<typeof educatorSchema>;

const promotionSchema = z.object({
    text: z.string().min(1, 'टेक्स्ट आवश्यक है'),
});
type PromotionFormValues = z.infer<typeof promotionSchema>;


export default function AdminDashboard() {
  const { firestore, storage } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEducatorDialogOpen, setIsEducatorDialogOpen] = useState(false);
  const [isPromoDialogOpen, setIsPromoDialogOpen] = useState(false);
  const [educatorPhoto, setEducatorPhoto] = useState<File | null>(null);

  const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
  const enrollmentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courseEnrollments') : null), [firestore]);
  const educatorsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'educators') : null), [firestore]);
  const promotionsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'promotions') : null), [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);
  const { data: educators, isLoading: educatorsLoading } = useCollection(educatorsQuery);
  const { data: promotions, isLoading: promotionsLoading } = useCollection(promotionsQuery);

  const educatorForm = useForm<EducatorFormValues>({ resolver: zodResolver(educatorSchema), defaultValues: { name: '', experience: '' } });
  const promotionForm = useForm<PromotionFormValues>({ resolver: zodResolver(promotionSchema), defaultValues: { text: '' } });

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

  const onPromotionSubmit = async (values: PromotionFormValues) => {
      if (!firestore) return;
      setIsSubmitting(true);
      try {
          const promoData = { ...values, createdAt: serverTimestamp() };
          await addDoc(collection(firestore, 'promotions'), promoData);
          toast({ title: 'सफलता!', description: 'नया प्रमोशन जोड़ दिया गया है।'});
          promotionForm.reset();
          setIsPromoDialogOpen(false);
      } catch (error: any) {
          console.error("Promotion creation error:", error);
          const contextualError = new FirestorePermissionError({ operation: 'create', path: 'promotions', requestResourceData: values });
          errorEmitter.emit('permission-error', contextualError);
          toast({ variant: 'destructive', title: 'त्रुटि', description: error.message || 'प्रमोशन बनाने में विफल।'});
      } finally {
        setIsSubmitting(false);
      }
  };
  
  const deletePromotion = async (id: string) => {
      if (!firestore) return;
      try {
          await deleteDoc(doc(firestore, 'promotions', id));
          toast({ title: 'सफलता!', description: 'प्रमोशन हटा दिया गया है।'});
      } catch (error: any) {
           console.error("Promotion deletion error:", error);
           toast({ variant: 'destructive', title: 'त्रुटि', description: 'प्रमोशन हटाने में विफल।'});
      }
  };

  const handleEnrollmentStatusChange = async (enrollmentId: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;

    const enrollmentRef = doc(firestore, 'courseEnrollments', enrollmentId);
    try {
        await updateDoc(enrollmentRef, { status: status });
        toast({ title: 'सफलता!', description: `एनरोलमेंट को ${status} के रूप में अपडेट कर दिया गया है।`});
    } catch (error) {
        console.error("Enrollment update error:", error);
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'एनरोलमेंट स्थिति को अपडेट करने में विफल।'});
    }
  }


  const loading = usersLoading || coursesLoading || enrollmentsLoading || educatorsLoading || promotionsLoading;

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved': return <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
        case 'pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
        case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">एडमिन डैशबोर्ड</h1>
      <p className="text-muted-foreground mb-8">यूज़र, कोर्स, एनरोलमेंट और सेटिंग्स मैनेज करें।</p>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-6">
          <TabsTrigger value="overview">अवलोकन</TabsTrigger>
          <TabsTrigger value="courses">कोर्सेस</TabsTrigger>
          <TabsTrigger value="enrollments">एनरोलमेंट्स</TabsTrigger>
          <TabsTrigger value="users">यूज़र्स</TabsTrigger>
          <TabsTrigger value="educators">एजुकेटर्स</TabsTrigger>
          <TabsTrigger value="promotions">प्रमोशन</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">यूज़र्स</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{loading ? <Loader className="animate-spin"/> : <div className="text-2xl font-bold">{users?.length ?? 0}</div>}</CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">कोर्सेस</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{loading ? <Loader className="animate-spin"/> : <div className="text-2xl font-bold">{courses?.length ?? 0}</div>}</CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">एनरोलमेंट्स</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{loading ? <Loader className="animate-spin"/> : <div className="text-2xl font-bold">{enrollments?.length ?? 0}</div>}</CardContent></Card>
            </div>
             <div className="mt-8 flex gap-4">
                <Button asChild><Link href="/admin/create-course"><PlusCircle className="mr-2 h-4 w-4" />नया कोर्स बनाएं</Link></Button>
                <Button asChild variant="outline"><Link href="/admin/settings"><Settings className="mr-2 h-4 w-4" />ऐप सेटिंग्स</Link></Button>
            </div>
        </TabsContent>
        
        <TabsContent value="courses">
            <Card className="mt-6">
                <CardHeader><CardTitle>सभी कोर्सेस</CardTitle></CardHeader>
                <CardContent>{coursesLoading && <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>}<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{courses?.map(course => (<Card key={course.id}><Image src={course.thumbnailUrl} alt={course.name} width={400} height={200} className="rounded-t-lg object-cover w-full h-32"/><CardHeader><CardTitle className="text-lg line-clamp-1">{course.name}</CardTitle></CardHeader><CardContent><Button asChild className="w-full"><Link href={`/courses/${course.id}`}>देखें</Link></Button></CardContent></Card>))}</div></CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="enrollments">
            <Card className="mt-6">
                <CardHeader><CardTitle>सभी एनरोलमेंट्स</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Enrollment ID</TableHead><TableHead>User ID</TableHead><TableHead>Course ID</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {enrollmentsLoading && <TableRow><TableCell colSpan={5} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                            {enrollments?.map(enrollment => (
                                <TableRow key={enrollment.id}>
                                    <TableCell className="font-mono text-xs">{enrollment.id}</TableCell>
                                    <TableCell className="font-mono text-xs">{enrollment.userId}</TableCell>
                                    <TableCell className="font-mono text-xs">{enrollment.courseId}</TableCell>
                                    <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                                    <TableCell className="space-x-2">
                                        {enrollment.status !== 'approved' && <Button size="sm" variant="success" onClick={() => handleEnrollmentStatusChange(enrollment.id, 'approved')}>Approve</Button>}
                                        {enrollment.status !== 'rejected' && <Button size="sm" variant="destructive" onClick={() => handleEnrollmentStatusChange(enrollment.id, 'rejected')}>Reject</Button>}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="users">
            <Card className="mt-6">
                <CardHeader><CardTitle>सभी यूज़र्स</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>UID</TableHead><TableHead>Email</TableHead><TableHead>Name</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {usersLoading && <TableRow><TableCell colSpan={3} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                            {users?.map(user => (<TableRow key={user.id}><TableCell className="font-mono text-xs">{user.id}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.name || 'N/A'}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="educators">
            <Card className="mt-6">
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
                 <CardContent>{educatorsLoading && <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>}<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{educators?.map(educator => (<Card key={educator.id} className="text-center"><Image src={educator.imageUrl} alt={educator.name} width={200} height={200} className="w-full h-40 object-cover rounded-t-lg"/><CardHeader className="p-4"><CardTitle className="text-base">{educator.name}</CardTitle></CardHeader><CardContent className="p-4 pt-0"><p className="text-sm text-muted-foreground">{educator.experience}</p></CardContent></Card>))}</div></CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="promotions">
             <Card className="mt-6">
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>प्रमोशन</CardTitle>
                     <Dialog open={isPromoDialogOpen} onOpenChange={setIsPromoDialogOpen}>
                        <DialogTrigger asChild><Button><Megaphone className="mr-2 h-4 w-4" />नया प्रमोशन जोड़ें</Button></DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader><DialogTitle>नया प्रमोशन जोड़ें</DialogTitle></DialogHeader>
                            <Form {...promotionForm}>
                            <form onSubmit={promotionForm.handleSubmit(onPromotionSubmit)} className="space-y-4">
                                <FormField control={promotionForm.control} name="text" render={({ field }) => (<FormItem><FormLabel>प्रमोशन टेक्स्ट</FormLabel><FormControl><Input placeholder="जैसे, दिवाली पर 50% की छूट!" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                                <Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> जोड़ा जा रहा है...</> : 'प्रमोशन जोड़ें'}</Button>
                            </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                 <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>टेक्स्ट</TableHead><TableHead className="text-right">एक्शन</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {promotionsLoading && <TableRow><TableCell colSpan={2} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                            {promotions?.map(promo => (
                                <TableRow key={promo.id}>
                                    <TableCell>{promo.text}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>क्या आप वाकई निश्चित हैं?</AlertDialogTitle><AlertDialogDescription>यह क्रिया पूर्ववत नहीं की जा सकती। यह प्रमोशन हमेशा के लिए हटा दिया जाएगा।</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>रद्द करें</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deletePromotion(promo.id)}>हटाएं</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
