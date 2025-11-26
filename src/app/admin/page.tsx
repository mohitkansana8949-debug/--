
'use client';

import { useState, ChangeEvent, useMemo } from 'react';
import { useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Users,
  BookOpen,
  CreditCard,
  PlusCircle,
  Loader,
  Settings,
  UserPlus,
  Megaphone,
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
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

const courseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
  thumbnailUrl: z.string().url('Must be a valid URL'),
  isFree: z.boolean().default(false),
  content: z.string().optional(),
});
type CourseFormValues = z.infer<typeof courseSchema>;

const educatorSchema = z.object({
    name: z.string().min(1, 'नाम आवश्यक है'),
    experience: z.string().min(1, 'अनुभव आवश्यक है'),
});
type EducatorFormValues = z.infer<typeof educatorSchema>;

const promotionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  link: z.string().url('Must be a valid URL'),
});
type PromotionFormValues = z.infer<typeof promotionSchema>;


export default function AdminDashboard() {
  const { firestore, storage } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isEducatorDialogOpen, setIsEducatorDialogOpen] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [educatorPhoto, setEducatorPhoto] = useState<File | null>(null);

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
  const promotionsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'promotions'), where('isActive', '==', true), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );


  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: courses, isLoading: coursesLoading } =
    useCollection(coursesQuery);
  const { data: enrollments, isLoading: enrollmentsLoading } =
    useCollection(enrollmentsQuery);
  const { data: promotions, isLoading: promotionsLoading } = useCollection(promotionsQuery);

  const courseForm = useForm<CourseFormValues>({
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

  const educatorForm = useForm<EducatorFormValues>({
      resolver: zodResolver(educatorSchema),
      defaultValues: {
          name: '',
          experience: '',
      },
  });
  
  const promotionForm = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      name: '',
      link: '',
    },
  });

  const onCourseSubmit = async (values: CourseFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);
    
    const courseData = { ...values, createdAt: serverTimestamp() };

    addDoc(collection(firestore, 'courses'), courseData)
    .then(() => {
        toast({
            title: 'सफलता!',
            description: 'नया कोर्स बना दिया गया है।',
        });
        courseForm.reset();
        setIsCourseDialogOpen(false);
    })
    .catch((error) => {
        const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: 'courses',
            requestResourceData: courseData,
        });
        errorEmitter.emit('permission-error', contextualError);
    })
    .finally(() => {
        setIsSubmitting(false);
    });
  };

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

        const educatorData = {
            ...values,
            imageUrl: imageUrl,
            createdAt: serverTimestamp(),
        };

        setDoc(docRef, educatorData)
        .then(() => {
            toast({ title: 'सफलता!', description: 'नए एजुकेटर को जोड़ दिया गया है।'});
            educatorForm.reset();
            setEducatorPhoto(null);
            setIsEducatorDialogOpen(false);
        })
        .catch(error => {
             const contextualError = new FirestorePermissionError({
                operation: 'create',
                path: docRef.path,
                requestResourceData: educatorData,
            });
            errorEmitter.emit('permission-error', contextualError);
        })
        .finally(() => {
             setIsSubmitting(false);
        });

      } catch (error) {
          console.error("Error during photo upload:", error);
          toast({ variant: 'destructive', title: 'त्रुटि', description: 'फोटो अपलोड नहीं हो सकी।'});
          setIsSubmitting(false);
      }
  };

  const onPromotionSubmit = async (values: PromotionFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);
    
    const promotionData = {
        ...values,
        createdAt: serverTimestamp(),
        isActive: true, // by default
    };

    addDoc(collection(firestore, 'promotions'), promotionData)
    .then(() => {
        toast({
            title: 'सफलता!',
            description: 'नया प्रमोशन जोड़ दिया गया है।',
        });
        promotionForm.reset();
        setIsPromotionDialogOpen(false);
    })
    .catch((error) => {
        const contextualError = new FirestorePermissionError({
            operation: 'create',
            path: 'promotions',
            requestResourceData: promotionData,
        });
        errorEmitter.emit('permission-error', contextualError);
    })
    .finally(() => {
        setIsSubmitting(false);
    });
  };


  const loading = usersLoading || coursesLoading || enrollmentsLoading;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">एडमिन डैशबोर्ड</h1>
        <p className="text-muted-foreground">
          यूज़र, कोर्स, एनरोलमेंट और सेटिंग्स मैनेज करें।
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">अवलोकन</TabsTrigger>
          <TabsTrigger value="users">यूज़र्स</TabsTrigger>
          <TabsTrigger value="educators">एजुकेटर्स</TabsTrigger>
          <TabsTrigger value="promotions">प्रमोशन</TabsTrigger>
          <TabsTrigger value="settings">ऐप सेटिंग्स</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
             <div className="mt-8">
                 <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
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
                        <Form {...courseForm}>
                        <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-4">
                            <FormField control={courseForm.control} name="name" render={({ field }) => (
                                <FormItem>
                                <FormLabel>कोर्स का नाम</FormLabel>
                                <FormControl><Input placeholder="जैसे, प्रोग्रामिंग का परिचय" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={courseForm.control} name="description" render={({ field }) => (
                                <FormItem>
                                <FormLabel>विवरण</FormLabel>
                                <FormControl><Textarea placeholder="कोर्स का संक्षिप्त सारांश" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={courseForm.control} name="thumbnailUrl" render={({ field }) => (
                                <FormItem>
                                <FormLabel>थंबनेल URL</FormLabel>
                                <FormControl><Input placeholder="https://picsum.photos/seed/..." {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={courseForm.control} name="content" render={({ field }) => (
                                <FormItem>
                                <FormLabel>कंटेंट</FormLabel>
                                <FormControl><Textarea placeholder="कोर्स कंटेंट (जैसे, वीडियो लिंक, टेक्स्ट)" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={courseForm.control} name="price" render={({ field }) => (
                                <FormItem>
                                <FormLabel>कीमत</FormLabel>
                                <FormControl><Input type="number" {...field} disabled={courseForm.watch('isFree')} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={courseForm.control} name="isFree" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5"><FormLabel>फ्री कोर्स</FormLabel></div>
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
                            )}/>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? (<><Loader className="mr-2 h-4 w-4 animate-spin" /> बनाया जा रहा है...</>) : ('कोर्स बनाएं')}
                            </Button>
                        </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </TabsContent>

        <TabsContent value="users">
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>सभी यूज़र्स</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>UID</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Password</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usersLoading && <TableRow><TableCell colSpan={4} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                            {users?.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.name || 'N/A'}</TableCell>
                                    <TableCell className="text-muted-foreground">Encrypted</TableCell>
                                </TableRow>
                            ))}
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
                        <DialogTrigger asChild>
                            <Button>
                            <UserPlus className="mr-2 h-4 w-4" />
                            नया एजुकेटर जोड़ें
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader><DialogTitle>नया एजुकेटर जोड़ें</DialogTitle></DialogHeader>
                            <Form {...educatorForm}>
                            <form onSubmit={educatorForm.handleSubmit(onEducatorSubmit)} className="space-y-4">
                                <FormField control={educatorForm.control} name="name" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>एजुकेटर का नाम</FormLabel>
                                    <FormControl><Input placeholder="जैसे, राहुल शर्मा" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={educatorForm.control} name="experience" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>अनुभव</FormLabel>
                                    <FormControl><Input placeholder="जैसे, 5+ साल वेब डेवलपमेंट में" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormItem>
                                    <FormLabel>फोटो</FormLabel>
                                    <FormControl><Input type="file" accept="image/*" onChange={(e) => setEducatorPhoto(e.target.files ? e.target.files[0] : null)} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> जोड़ा जा रहा है...</> : 'एजुकेटर जोड़ें'}
                                </Button>
                            </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                 <CardContent>
                    {/* List educators here */}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="promotions">
             <Card className="mt-6">
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>प्रमोशन</CardTitle>
                        <CardDescription>होम स्क्रीन पर दिखने वाले प्रमोशन मैनेज करें।</CardDescription>
                    </div>
                     <Dialog open={isPromotionDialogOpen} onOpenChange={setIsPromotionDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Megaphone className="mr-2 h-4 w-4" />
                                नया प्रमोशन जोड़ें
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader><DialogTitle>नया प्रमोशन जोड़ें</DialogTitle></DialogHeader>
                            <Form {...promotionForm}>
                            <form onSubmit={promotionForm.handleSubmit(onPromotionSubmit)} className="space-y-4">
                                <FormField control={promotionForm.control} name="name" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>प्रमोशन का नाम</FormLabel>
                                    <FormControl><Input placeholder="जैसे, दिवाली ऑफर" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={promotionForm.control} name="link" render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>लिंक</FormLabel>
                                    <FormControl><Input placeholder="https://example.com/offer" {...field} /></FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}/>
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> जोड़ा जा रहा है...</> : 'प्रमोशन जोड़ें'}
                                </Button>
                            </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>नाम</TableHead>
                                <TableHead>लिंक</TableHead>
                                <TableHead>स्टेटस</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {promotionsLoading && <TableRow><TableCell colSpan={3} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                            {promotions?.map(promo => (
                                <TableRow key={promo.id}>
                                    <TableCell>{promo.name}</TableCell>
                                    <TableCell className="font-mono text-xs">{promo.link}</TableCell>
                                    <TableCell>
                                        <Switch checked={promo.isActive} onCheckedChange={(checked) => {
                                            if (!firestore) return;
                                            const promoRef = doc(firestore, 'promotions', promo.id);
                                            const data = { isActive: checked };
                                            updateDoc(promoRef, data)
                                            .catch(error => {
                                                const contextualError = new FirestorePermissionError({
                                                    operation: 'update',
                                                    path: promoRef.path,
                                                    requestResourceData: data,
                                                });
                                                errorEmitter.emit('permission-error', contextualError);
                                            });
                                        }} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="settings">
          <AppSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}


function AppSettings() {
    const { firestore, storage } = useFirebase();
    const { toast } = useToast();
    const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
    const [mobileNumber, setMobileNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'settings', 'payment') : null),
      [firestore]
    );

    const handleSettingsUpdate = async () => {
        if (!firestore || !storage || !settingsDocRef) {
            toast({ variant: 'destructive', title: 'Error', description: 'Firebase not configured.'});
            return;
        }
        if (!qrCodeFile && !mobileNumber) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a QR code or a mobile number.'});
            return;
        }

        setIsSubmitting(true);
        try {
            const settingsUpdate: any = {};
            if (mobileNumber) {
                settingsUpdate.mobileNumber = mobileNumber;
            }

            if (qrCodeFile) {
                const storageRef = ref(storage, 'app_settings/payment_qr_code.png');
                await uploadBytes(storageRef, qrCodeFile);
                const qrCodeUrl = await getDownloadURL(storageRef);
                settingsUpdate.qrCodeUrl = qrCodeUrl;
            }

            setDoc(settingsDocRef, settingsUpdate, { merge: true })
            .then(() => {
                 toast({ title: 'Success!', description: 'Payment settings have been updated.'});
                 setQrCodeFile(null);
            })
            .catch(error => {
                const contextualError = new FirestorePermissionError({
                    operation: 'update',
                    path: settingsDocRef.path,
                    requestResourceData: settingsUpdate,
                });
                errorEmitter.emit('permission-error', contextualError);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
        } catch (error) {
            console.error('Error updating settings:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update settings.'});
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>पेमेंट सेटिंग्स</CardTitle>
                <CardDescription>पेमेंट के लिए QR कोड और मोबाइल नंबर सेट करें।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="qr-code-upload">पेमेंट QR कोड</Label>
                    <Input id="qr-code-upload" type="file" accept="image/png, image/jpeg" onChange={(e: ChangeEvent<HTMLInputElement>) => setQrCodeFile(e.target.files ? e.target.files[0] : null)} />
                    <p className="text-sm text-muted-foreground">यहां अपना पेमेंट QR कोड अपलोड करें।</p>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="mobile-number">पेमेंट मोबाइल नंबर</Label>
                    <Input id="mobile-number" type="tel" placeholder="जैसे, 9876543210" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                    <p className="text-sm text-muted-foreground">यहां अपना पेमेंट के लिए मोबाइल नंबर दर्ज करें।</p>
                </div>
                <Button onClick={handleSettingsUpdate} disabled={isSubmitting}>
                    {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> अपडेट हो रहा है...</> : 'सेटिंग्स अपडेट करें'}
                </Button>
            </CardContent>
        </Card>
    );
}

    

    

