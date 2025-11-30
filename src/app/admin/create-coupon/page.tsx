
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Loader, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').transform(v => v.toUpperCase()),
  discountType: z.enum(['percentage', 'fixed'], { required_error: 'Please select a discount type.'}),
  discountValue: z.coerce.number().min(1, 'Discount value must be at least 1'),
  expiresAt: z.date().optional(),
  maxUses: z.coerce.number().optional(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function CreateCouponPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: '',
      discountType: 'percentage',
      discountValue: 10,
    },
  });

  const onSubmit = async (values: CouponFormValues) => {
    if (!firestore) return;
    setIsSubmitting(true);

    try {
      const couponData: any = {
        ...values,
        createdAt: serverTimestamp(),
        uses: 0,
      };
      if (values.expiresAt) {
          couponData.expiresAt = Timestamp.fromDate(values.expiresAt);
      }
      
      const couponsCollection = collection(firestore, 'coupons');
      await addDoc(couponsCollection, couponData);
      
      toast({
          title: 'Success!',
          description: 'New coupon has been created.',
      });
      router.push(`/admin/coupons`);

    } catch (error: any) {
        console.error("Coupon creation error:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred while creating the coupon.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="p-4 border-b flex items-center gap-4">
        <Button asChild variant="outline">
          <Link href="/admin/coupons">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Coupons
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Create New Coupon</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Coupon Details</CardTitle>
            <CardDescription>Enter the details for the new coupon.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="code" render={({ field }) => (
                  <FormItem><FormLabel>Coupon Code</FormLabel><FormControl><Input placeholder="e.g., DIWALI20" {...field} /></FormControl><FormDescription>Users will enter this code at checkout.</FormDescription><FormMessage /></FormItem>
                )} />

                <FormField control={form.control} name="discountType" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Discount Type</FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="percentage" /></FormControl><FormLabel className="font-normal">Percentage</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="fixed" /></FormControl><FormLabel className="font-normal">Fixed Amount (₹)</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                 <FormField control={form.control} name="discountValue" render={({ field }) => (
                    <FormItem><FormLabel>Discount Value</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Enter a percentage (e.g., 10) or a fixed amount (e.g., 100).</FormDescription><FormMessage /></FormItem>
                 )} />

                <FormField control={form.control} name="expiresAt" render={({ field }) => (
                     <FormItem className="flex flex-col"><FormLabel>Expiry Date (Optional)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <FormDescription>The coupon will be invalid after this date.</FormDescription><FormMessage />
                    </FormItem>
                )} />
                
                 <FormField control={form.control} name="maxUses" render={({ field }) => (
                    <FormItem><FormLabel>Maximum Uses (Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} /></FormControl><FormDescription>Leave blank for unlimited uses.</FormDescription><FormMessage /></FormItem>
                 )} />

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Save Coupon'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
