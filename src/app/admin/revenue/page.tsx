
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCollection, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, getDocs, Timestamp, doc, setDoc, getDoc, query, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DollarSign,
  Loader,
  Users,
  PieChart as PieChartIcon,
  Edit
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Pie, PieChart as RechartsPieChart, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

const ADMIN_REVENUE_CODE = 'Quicklympohit089';

function EditRevenueDialog({ currentRevenue, onUpdate }: { currentRevenue: number, onUpdate: (newRevenue: number) => Promise<void> }) {
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [newRevenue, setNewRevenue] = useState(currentRevenue);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleVerifyCode = () => {
        if (code === ADMIN_REVENUE_CODE) {
            setShowEditor(true);
        } else {
            toast({ variant: 'destructive', title: 'Invalid Code' });
        }
    };

    const handleUpdate = async () => {
        setIsSubmitting(true);
        try {
            await onUpdate(newRevenue);
            toast({ title: 'Success', description: 'Revenue override has been updated.' });
            setOpen(false);
        } catch (error) {
             const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: 'settings/revenue',
                requestResourceData: { overrideTotal: newRevenue },
            });
            errorEmitter.emit('permission-error', contextualError);
             toast({ variant: 'destructive', title: 'Error', description: 'Failed to update revenue.' });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    useEffect(() => {
        if (open) {
            // Reset state when dialog opens
            setCode('');
            setShowEditor(false);
            setNewRevenue(currentRevenue);
        }
    }, [open, currentRevenue]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4" /> Edit Revenue</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Total Revenue</DialogTitle>
                    <DialogDescription>
                        {showEditor ? "Enter the new total revenue amount." : "Enter the security code to edit revenue."}
                    </DialogDescription>
                </DialogHeader>
                {!showEditor ? (
                    <div className="space-y-4 py-4">
                        <Label htmlFor="security-code">Security Code</Label>
                        <Input id="security-code" type="password" value={code} onChange={(e) => setCode(e.target.value)} />
                        <Button onClick={handleVerifyCode} className="w-full">Verify</Button>
                    </div>
                ) : (
                     <div className="space-y-4 py-4">
                        <Label htmlFor="revenue-input">Total Revenue (₹)</Label>
                        <Input id="revenue-input" type="number" value={newRevenue} onChange={(e) => setNewRevenue(Number(e.target.value))} />
                        <Button onClick={handleUpdate} className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="animate-spin" /> : null}
                            Update Revenue
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}


export default function AdminRevenuePage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const revenueOverrideRef = useMemoFirebase(() => doc(firestore, 'settings', 'revenue'), [firestore]);

  // Use useCollection to get live updates on enrollments
  const approvedEnrollmentsQuery = useMemoFirebase(() => query(collection(firestore, 'enrollments'), where('status', '==', 'approved')), [firestore]);
  const deliveredOrdersQuery = useMemoFirebase(() => query(collection(firestore, 'bookOrders'), where('status', '==', 'Delivered')), [firestore]);

  const { data: approvedEnrollments, isLoading: enrollmentsLoading } = useCollection(approvedEnrollmentsQuery);
  const { data: deliveredOrders, isLoading: ordersLoading } = useCollection(deliveredOrdersQuery);

  const calculateAndSetRevenue = useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);

    try {
        const overrideDoc = await getDoc(revenueOverrideRef);
        if (overrideDoc.exists() && overrideDoc.data().overrideTotal !== undefined) {
            setTotalRevenue(overrideDoc.data().overrideTotal);
        } else {
            // This calculation will now run whenever the dependencies (approvedEnrollments, deliveredOrders) change
            let calculatedRevenue = 0;

            approvedEnrollments?.forEach(enrollment => {
                const itemPrice = enrollment.itemPrice || 0;
                const discount = enrollment.appliedCoupon?.discountAmount || 0;
                calculatedRevenue += (itemPrice - discount);
            });

            deliveredOrders?.forEach(order => {
                // Book orders already have a 'total' which is subtotal - discount
                if (typeof order.total === 'number') {
                    calculatedRevenue += order.total;
                }
            });

            setTotalRevenue(calculatedRevenue);
        }
    } catch (error) {
        console.error("Failed to fetch revenue data", error);
        toast({variant: 'destructive', title: 'Error', description: 'Could not load revenue data.'})
    } finally {
        setIsLoading(false);
    }
  }, [firestore, revenueOverrideRef, approvedEnrollments, deliveredOrders, toast]);

  useEffect(() => {
      // Recalculate revenue when live data changes or on initial load
      if (!enrollmentsLoading && !ordersLoading) {
        calculateAndSetRevenue();
      }
  }, [enrollmentsLoading, ordersLoading, calculateAndSetRevenue]);


  const handleUpdateRevenue = async (newRevenue: number) => {
    if (!firestore) throw new Error("Firestore not available");
    await setDoc(revenueOverrideRef, { overrideTotal: newRevenue });
    setTotalRevenue(newRevenue); // Immediately update UI
    toast({ title: 'Success!', description: 'Revenue override has been set.' });
  }


  const revenueSplit = [
      { name: 'Ashok (Quickly Study Owner)', value: totalRevenue * 0.80, percentage: 80, color: '#0088FE' },
      { name: 'App Management', value: totalRevenue * 0.15, percentage: 15, color: '#00C49F' },
      { name: 'Mohit (App Developer)', value: totalRevenue * 0.05, percentage: 5, color: '#FFBB28' },
  ];

  const chartConfig = {
      revenue: { label: 'Revenue' },
      ashok: { label: 'Ashok (Quickly Study Owner)', color: '#0088FE' },
      management: { label: 'App Management', color: '#00C49F' },
      mohit: { label: 'Mohit (App Developer)', color: '#FFBB28' },
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>A detailed breakdown of revenue and its distribution.</CardDescription>
                </div>
                <EditRevenueDialog currentRevenue={totalRevenue} onUpdate={handleUpdateRevenue} />
            </CardHeader>
        </Card>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Gross Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Total earnings from approved enrollments.</p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><PieChartIcon className="mr-2" /> Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="h-[250px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-full">
                            <RechartsPieChart>
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Pie data={revenueSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                    {revenueSplit.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </RechartsPieChart>
                        </ChartContainer>
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
