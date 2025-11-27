
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  BookOpen,
  CreditCard,
  PlusCircle,
  Loader,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const ADMIN_CODE = "Qukly";

const codeSchema = z.object({
    code: z.string().min(1, 'कोड आवश्यक है'),
});
type CodeFormValues = z.infer<typeof codeSchema>;


export default function AdminDashboardOverview() {
  const { firestore } = useFirebase();
  const { isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  useEffect(() => {
    // Check session storage to see if user has already been verified
    if (sessionStorage.getItem('admin-verified') === 'true') {
        setIsAdminVerified(true);
    }
  }, []);
  
  const usersQuery = useMemoFirebase(() => (firestore && isAdminVerified ? collection(firestore, 'users') : null), [firestore, isAdminVerified]);
  const coursesQuery = useMemoFirebase(() => (firestore && isAdminVerified ? collection(firestore, 'courses') : null), [firestore, isAdminVerified]);
  const enrollmentsQuery = useMemoFirebase(() => (firestore && isAdminVerified ? collection(firestore, 'courseEnrollments') : null), [firestore, isAdminVerified]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

  const codeForm = useForm<CodeFormValues>({resolver: zodResolver(codeSchema), defaultValues: { code: '' }});

  const handleCodeSubmit = (values: CodeFormValues) => {
      if (values.code === ADMIN_CODE) {
          toast({ title: 'सफलता!', description: 'एडमिन एक्सेस प्रदान किया गया।'});
          sessionStorage.setItem('admin-verified', 'true');
          setIsAdminVerified(true);
      } else {
          toast({ variant: 'destructive', title: 'गलत कोड', description: 'प्रदान किया गया एडमिन कोड गलत है।'});
      }
  }


  const loading = isUserLoading || (isAdminVerified && (usersLoading || coursesLoading || enrollmentsLoading));

  if (isUserLoading) {
      return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>
  }

  if (!isAdminVerified) {
      return (
          <Dialog open={true} onOpenChange={() => {}}>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>एडमिन एक्सेस</DialogTitle>
                      <DialogDescription>
                          एडमिन डैशबोर्ड तक पहुंचने के लिए कृपया एडमिन कोड दर्ज करें।
                      </DialogDescription>
                  </DialogHeader>
                   <Form {...codeForm}>
                        <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)} className="space-y-4">
                            <FormField control={codeForm.control} name="code" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>एडमिन कोड</FormLabel>
                                    <FormControl><Input type="password" placeholder="••••••" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <Button type="submit" className="w-full">एक्सेस करें</Button>
                        </form>
                    </Form>
              </DialogContent>
          </Dialog>
      )
  }


  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">यूज़र्स</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{loading ? <Loader className="animate-spin"/> : <div className="text-2xl font-bold">{users?.length ?? 0}</div>}</CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">कोर्सेस</CardTitle><BookOpen className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{loading ? <Loader className="animate-spin"/> : <div className="text-2xl font-bold">{courses?.length ?? 0}</div>}</CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">एनरोलमेंट्स</CardTitle><CreditCard className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent>{loading ? <Loader className="animate-spin"/> : <div className="text-2xl font-bold">{enrollments?.length ?? 0}</div>}</CardContent></Card>
        </div>
         <div className="mt-8 flex gap-4">
            <Button asChild><Link href="/admin/create-course"><PlusCircle className="mr-2 h-4 w-4" />नया कोर्स बनाएं</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/settings"><Settings className="mr-2 h-4 w-4" />ऐप सेटिंग्स</Link></Button>
        </div>
    </div>
  );
}
