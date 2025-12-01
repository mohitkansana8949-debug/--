'use client';

import { useState, useEffect } from 'react';
import { useCollection, useUser } from '@/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DollarSign,
  Loader,
  Users,
  PieChart as PieChartIcon
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

export default function AdminRevenuePage() {
  const { firestore } = useFirebase();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      const fetchRevenueData = async () => {
          if (!firestore) return;
          setIsLoading(true);

          try {
              const collections = ['enrollments', 'bookOrders'];
              const promises = collections.map(col => getDocs(collection(firestore, col)));
              const snapshots = await Promise.all(promises);

              const [enrollmentsSnap, bookOrdersSnap] = snapshots;
              
              let calculatedRevenue = 0;

              // This logic is simplified. In a real app, you'd fetch the price of each item.
              enrollmentsSnap.forEach(doc => {
                  calculatedRevenue += doc.data().itemPrice || 0;
              });

              bookOrdersSnap.forEach(doc => {
                  calculatedRevenue += doc.data().total || 0;
              });
              
              setTotalRevenue(calculatedRevenue);

          } catch (error) {
              console.error("Failed to fetch revenue data", error);
          } finally {
              setIsLoading(false);
          }
      };
      
      fetchRevenueData();
  }, [firestore]);

  const revenueSplit = [
      { name: 'Ashok (Quickly Study Owner)', value: totalRevenue * 0.80, percentage: 80, color: '#0088FE' },
      { name: 'App Management', value: totalRevenue * 0.15, percentage: 15, color: '#00C49F' },
      { name: 'Mohit (App Developer)', value: totalRevenue * 0.05, percentage: 5, color: '#FFBB28' },
  ];

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>A detailed breakdown of revenue and its distribution.</CardDescription>
            </CardHeader>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gross Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total earnings before distribution.</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><PieChartIcon className="mr-2" /> Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie data={revenueSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                {revenueSplit.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        </RechartsPieChart>
                   </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                    {revenueSplit.map((item, index) => (
                        <div key={item.name} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                <span className="font-medium">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">₹{item.value.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">{item.percentage}% of total</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
