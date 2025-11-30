
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, getDocs, Timestamp, getDoc, doc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DollarSign,
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, XAxis, YAxis, CartesianGrid, BarChart as RechartsBarChart, ResponsiveContainer } from 'recharts';
import { subDays, format, startOfDay } from 'date-fns';

const processChartData = (items: any[] | null, dateKey: 'signUpDate' | 'enrollmentDate' | 'createdAt') => {
    if (!items) return [];
    const last7Days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), i))).reverse();
    
    const dailyCounts = last7Days.map(day => {
        const dayString = format(day, 'MMM d');
        const count = items.filter(item => {
            if (!item[dateKey]) return false;
            const itemDate = item[dateKey] instanceof Timestamp ? item[dateKey].toDate() : new Date(item[dateKey]);
            return startOfDay(itemDate).getTime() === day.getTime();
        }).length;
        return { date: dayString, count };
    });

    return dailyCounts;
};

export default function AdminDashboardOverview() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const [stats, setStats] = useState({
      users: 0,
      courses: 0,
      ebooks: 0,
      pyqs: 0,
      tests: 0,
      enrollments: 0,
      bookOrders: 0,
      totalRevenue: 0,
  });
  const [chartData, setChartData] = useState<{users: any[], enrollments: any[], bookOrders: any[]}>({
      users: [],
      enrollments: [],
      bookOrders: []
  });
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
        setIsAdminLoading(true);
        if (user && firestore) {
            try {
                if (user.email === 'Qukly@study.com') {
                    setIsAdmin(true);
                    return;
                }
                const adminRef = doc(firestore, 'roles_admin', user.uid);
                const adminDoc = await getDoc(adminRef);
                setIsAdmin(adminDoc.exists());
            } catch (error) {
                console.error("Error checking admin status:", error);
                setIsAdmin(false);
            }
        } else {
            setIsAdmin(false);
        }
        setIsAdminLoading(false);
    };

    if (!isUserLoading) {
        checkAdminStatus();
    }
  }, [user, firestore, isUserLoading]);
  
  const canFetchAdminData = !isUserLoading && !isAdminLoading && isAdmin;
  
  useEffect(() => {
      const fetchAdminData = async () => {
          if (!firestore) return;
          setIsDataLoading(true);

          try {
              const collections = ['users', 'courses', 'ebooks', 'pyqs', 'tests', 'enrollments', 'bookOrders'];
              const promises = collections.map(col => getDocs(collection(firestore, col)));
              const snapshots = await Promise.all(promises);

              const [usersSnap, coursesSnap, ebooksSnap, pyqsSnap, testsSnap, enrollmentsSnap, bookOrdersSnap] = snapshots;

              const usersData = usersSnap.docs.map(d => d.data());
              const enrollmentsData = enrollmentsSnap.docs.map(d => d.data());
              const bookOrdersData = bookOrdersSnap.docs.map(d => d.data());

              const bookRevenue = bookOrdersSnap.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
              const enrollmentRevenue = enrollmentsSnap.docs.reduce((acc, doc) => {
                  const itemPrice = doc.data().itemPrice || 0; // Assuming price is stored
                  return acc + itemPrice;
              }, 0);
              const totalRevenue = bookRevenue + enrollmentRevenue;


              setStats({
                  users: usersSnap.size,
                  courses: coursesSnap.size,
                  ebooks: ebooksSnap.size,
                  pyqs: pyqsSnap.size,
                  tests: testsSnap.size,
                  enrollments: enrollmentsSnap.size,
                  bookOrders: bookOrdersSnap.size,
                  totalRevenue,
              });

              setChartData({
                  users: processChartData(usersData, 'signUpDate'),
                  enrollments: processChartData(enrollmentsData, 'enrollmentDate'),
                  bookOrders: processChartData(bookOrdersData, 'createdAt')
              });

          } catch (error) {
              console.error("Failed to fetch admin data", error);
          } finally {
              setIsDataLoading(false);
          }
      };

      if (canFetchAdminData) {
          fetchAdminData();
      } else if (!isUserLoading && !isAdminLoading && !isAdmin) {
          setIsDataLoading(false); // Not an admin, so stop loading
      }

  }, [firestore, canFetchAdminData, isUserLoading, isAdminLoading, isAdmin]);

  const statCards = [
      { title: 'यूज़र्स', icon: Users, value: stats.users },
      { title: 'कोर्सेस', icon: BookOpen, value: stats.courses },
      { title: 'E-books', icon: Book, value: stats.ebooks },
      { title: 'PYQs', icon: FileQuestion, value: stats.pyqs },
      { title: 'Tests', icon: Newspaper, value: stats.tests },
      { title: 'एनरोलमेंट्स', icon: CreditCard, value: stats.enrollments },
      { title: 'Book Orders', icon: ShoppingBag, value: stats.bookOrders },
  ];

  const loading = isUserLoading || isAdminLoading || isDataLoading;

  if (loading) {
      return <div className="flex h-full items-center justify-center"><Loader className="animate-spin" /></div>
  }

  // This check is now safe because loading states are handled.
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
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">कुल रेवेन्यू</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>{loading ? <Loader className="animate-spin"/> : <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>}</CardContent>
           </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">आपका हिस्सा (70%)</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground text-green-500" />
              </CardHeader>
              <CardContent>{loading ? <Loader className="animate-spin"/> : <div className="text-2xl font-bold text-green-500">₹{(stats.totalRevenue * 0.70).toFixed(2)}</div>}</CardContent>
           </Card>
           {statCards.map(stat => (
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
                                <RechartsBarChart data={chartData.users} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                                <RechartsBarChart data={chartData.enrollments} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                                <RechartsBarChart data={chartData.bookOrders} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
