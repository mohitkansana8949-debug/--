
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  BookOpen,
  CreditCard,
  Loader,
  Book,
  FileQuestion,
  Newspaper,
  BarChart,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart, ResponsiveContainer } from 'recharts';
import { subDays, format, startOfDay } from 'date-fns';

const ADMIN_CODE = "Quickly";

const codeSchema = z.object({
    code: z.string().min(1, 'कोड आवश्यक है'),
});
type CodeFormValues = z.infer<typeof codeSchema>;

const processChartData = (items: any[] | null, dateKey: 'signUpDate' | 'enrollmentDate' | 'createdAt') => {
    const last7Days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), i))).reverse();
    
    const dailyCounts = last7Days.map(day => {
        const dayString = format(day, 'MMM d');
        const count = items?.filter(item => {
            if (!item[dateKey]) return false;
            // Handle both Firestore Timestamps and regular Date objects
            const itemDate = item[dateKey] instanceof Timestamp ? item[dateKey].toDate() : new Date(item[dateKey]);
            return startOfDay(itemDate).getTime() === day.getTime();
        }).length || 0;
        return { date: dayString, count };
    });

    return dailyCounts;
};

export default function AdminDashboardOverview() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
        if (user && firestore) {
            try {
                const adminRef = doc(firestore, 'roles_admin', user.uid);
                const adminDoc = await getDoc(adminRef);
                setIsAdmin(adminDoc.exists());
            } catch (error) {
                console.error("Error checking admin status:", error);
                setIsAdmin(false);
            }
        }
        setIsAdminLoading(false);
    };

    if (!isUserLoading) {
        checkAdminStatus();
    }
  }, [user, firestore, isUserLoading]);
  
  const canFetchAdminData = !isAdminLoading && isAdmin;

  const usersQuery = useMemoFirebase(() => (firestore && canFetchAdminData ? collection(firestore, 'users') : null), [firestore, canFetchAdminData]);
  const coursesQuery = useMemoFirebase(() => (firestore && canFetchAdminData ? collection(firestore, 'courses') : null), [firestore, canFetchAdminData]);
  const enrollmentsQuery = useMemoFirebase(() => (firestore && canFetchAdminData ? collection(firestore, 'enrollments') : null), [firestore, canFetchAdminData]);
  const ebooksQuery = useMemoFirebase(() => (firestore && canFetchAdminData ? collection(firestore, 'ebooks') : null), [firestore, canFetchAdminData]);
  const pyqsQuery = useMemoFirebase(() => (firestore && canFetchAdminData ? collection(firestore, 'pyqs') : null), [firestore, canFetchAdminData]);
  const testsQuery = useMemoFirebase(() => (firestore && canFetchAdminData ? collection(firestore, 'tests') : null), [firestore, canFetchAdminData]);
  const bookOrdersQuery = useMemoFirebase(() => (firestore && canFetchAdminData ? collection(firestore, 'bookOrders') : null), [firestore, canFetchAdminData]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);
  const { data: ebooks, isLoading: ebooksLoading } = useCollection(ebooksQuery);
  const { data: pyqs, isLoading: pyqsLoading } = useCollection(pyqsQuery);
  const { data: tests, isLoading: testsLoading } = useCollection(testsQuery);
  const { data: bookOrders, isLoading: bookOrdersLoading } = useCollection(bookOrdersQuery);
  
  const newUsersChartData = useMemo(() => processChartData(users, 'signUpDate'), [users]);
  const newEnrollmentsChartData = useMemo(() => processChartData(enrollments, 'enrollmentDate'), [enrollments]);
  const newBookOrdersChartData = useMemo(() => processChartData(bookOrders, 'createdAt'), [bookOrders]);


  const codeForm = useForm<CodeFormValues>({resolver: zodResolver(codeSchema), defaultValues: { code: '' }});

  const loading = isUserLoading || isAdminLoading || (canFetchAdminData && (usersLoading || coursesLoading || enrollmentsLoading || ebooksLoading || pyqsLoading || testsLoading || bookOrdersLoading));

  const stats = [
      { title: 'यूज़र्स', icon: Users, value: users?.length ?? 0 },
      { title: 'कोर्सेस', icon: BookOpen, value: courses?.length ?? 0 },
      { title: 'E-books', icon: Book, value: ebooks?.length ?? 0 },
      { title: 'PYQs', icon: FileQuestion, value: pyqs?.length ?? 0 },
      { title: 'Tests', icon: Newspaper, value: tests?.length ?? 0 },
      { title: 'एनरोलमेंट्स', icon: CreditCard, value: enrollments?.length ?? 0 },
      { title: 'Book Orders', icon: ShoppingBag, value: bookOrders?.length ?? 0 },
  ];

  if (isUserLoading || isAdminLoading) {
      return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>
  }

  if (!isAdmin) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Access Denied</CardTitle>
                  <CardDescription>You do not have permission to view the admin dashboard.</CardDescription>
              </CardHeader>
          </Card>
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Users className="mr-2" /> New Users (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2 h-[250px]">
                   <ResponsiveContainer width="100%" height="100%">
                        {loading ? <div className="h-full flex justify-center items-center"><Loader className="animate-spin" /></div> : (
                            <ChartContainer config={{ count: { label: "Users", color: "hsl(var(--chart-1))" } }}>
                                <RechartsBarChart data={newUsersChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                    <YAxis allowDecimals={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </RechartsBarChart>
                            </ChartContainer>
                        )}
                   </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><CreditCard className="mr-2" /> New Enrollments (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2 h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {loading ? <div className="h-full flex justify-center items-center"><Loader className="animate-spin" /></div> : (
                            <ChartContainer config={{ count: { label: "Enrollments", color: "hsl(var(--chart-2))" } }}>
                                <RechartsBarChart data={newEnrollmentsChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                    <YAxis allowDecimals={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </RechartsBarChart>
                            </ChartContainer>
                        )}
                   </ResponsiveContainer>
                </CardContent>
            </Card>
             <Card className="xl:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center"><ShoppingBag className="mr-2" /> New Book Orders (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent className="pl-2 h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {loading ? <div className="h-full flex justify-center items-center"><Loader className="animate-spin" /></div> : (
                            <ChartContainer config={{ count: { label: "Orders", color: "hsl(var(--chart-3))" } }}>
                                <RechartsBarChart data={newBookOrdersChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                    <YAxis allowDecimals={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </RechartsBarChart>
                            </ChartContainer>
                        )}
                   </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

    