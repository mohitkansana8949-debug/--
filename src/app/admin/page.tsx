
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  BookOpen,
  CreditCard,
  PlusCircle,
  Loader,
  Settings,
  Book,
  FileQuestion,
  Newspaper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const ADMIN_CODE = "Quickly";

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
    if (sessionStorage.getItem('admin-verified') === 'true') {
        setIsAdminVerified(true);
    }
  }, []);
  
  const usersQuery = useMemoFirebase(() => (firestore && isAdminVerified ? collection(firestore, 'users') : null), [firestore, isAdminVerified]);
  const coursesQuery = useMemoFirebase(() => (firestore && isAdminVerified ? collection(firestore, 'courses') : null), [firestore, isAdminVerified]);
  const enrollmentsQuery = useMemoFirebase(() => (firestore && isAdminVerified ? collection(firestore, 'enrollments') : null), [firestore, isAdminVerified]);
  const ebooksQuery = useMemoFirebase(() => (firestore && isAdminVerified ? collection(firestore, 'ebooks') : null), [firestore, isAdminVerified]);
  const pyqsQuery = useMemoFirebase(() => (firestore && isAdminVerified ? collection(firestore, 'pyqs') : null), [firestore, isAdminVerified]);
  const testsQuery = useMemoFirebase(() => (firestore && isAdminVerified ? collection(firestore, 'tests') : null), [firestore, isAdminVerified]);


  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);
  const { data: ebooks, isLoading: ebooksLoading } = useCollection(ebooksQuery);
  const { data: pyqs, isLoading: pyqsLoading } = useCollection(pyqsQuery);
  const { data: tests, isLoading: testsLoading } = useCollection(testsQuery);

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


  const loading = isUserLoading || (isAdminVerified && (usersLoading || coursesLoading || enrollmentsLoading || ebooksLoading || pyqsLoading || testsLoading));

  const stats = [
      { title: 'यूज़र्स', icon: Users, value: users?.length ?? 0 },
      { title: 'कोर्सेस', icon: BookOpen, value: courses?.length ?? 0 },
      { title: 'E-books', icon: Book, value: ebooks?.length ?? 0 },
      { title: 'PYQs', icon: FileQuestion, value: pyqs?.length ?? 0 },
      { title: 'Tests', icon: Newspaper, value: tests?.length ?? 0 },
      { title: 'एनरोलमेंट्स', icon: CreditCard, value: enrollments?.length ?? 0 },
  ];

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
           {stats.map(stat => (
                <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>{loading ? <Loader className="animate-spin"/> : <div className="text-2xl font-bold">{stat.value}</div>}</CardContent>
                </Card>
           ))}
        </div>
    </div>
  );
}
