
'use client';

import { useCart } from "@/hooks/use-cart";
import { useUser, useFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Loader } from "lucide-react";
import type { Address } from "@/lib/types";

const addressSchema = z.object({
  name: z.string().min(2, "Name is required"),
  mobile: z.string().length(10, "Mobile number must be 10 digits"),
  address: z.string().min(5, "Address is required"),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
});

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const { user } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<Address>({
        resolver: zodResolver(addressSchema),
        defaultValues: {
            name: user?.displayName || '',
            mobile: '',
            address: '',
            pincode: '',
            city: '',
            state: '',
        }
    });
    
    useEffect(() => {
        if (cart.length === 0) {
            toast({ title: "Your cart is empty", description: "Redirecting to bookshala..." });
            router.replace('/bookshala');
        }
    }, [cart, router, toast]);

    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const onSubmit = async (data: Address) => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to place an order.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const orderData = {
                userId: user.uid,
                items: cart,
                total: subtotal,
                address: data,
                createdAt: serverTimestamp(),
                status: 'Pending',
                paymentMethod: 'COD', // Placeholder, can be changed after payment integration
                paymentId: `cod_${Date.now()}`
            };

            const docRef = await addDoc(collection(firestore, 'bookOrders'), orderData);
            
            clearCart();
            toast({ title: 'Order Placed!', description: 'Your order has been placed successfully.' });
            
            router.push(`/my-orders/${docRef.id}`);

        } catch (error) {
            console.error("Order submission error:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to place your order.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cart.length === 0) {
        return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Shipping Address</CardTitle>
                        <CardDescription>Enter the address where you want to receive your books.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="mobile" render={({ field }) => (
                                    <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input type="tel" maxLength={10} {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="address" render={({ field }) => (
                                    <FormItem><FormLabel>Address (House No, Street)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                     <FormField control={form.control} name="pincode" render={({ field }) => (
                                        <FormItem><FormLabel>Pincode</FormLabel><FormControl><Input type="tel" maxLength={6} {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <FormField control={form.control} name="city" render={({ field }) => (
                                        <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="state" render={({ field }) => (
                                    <FormItem><FormLabel>State</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? <><Loader className="mr-2 h-4 w-4 animate-spin"/>Placing Order...</> : `Place Order (₹${subtotal.toFixed(2)})`}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
                 <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Your Items</h3>
                    {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4">
                            <Image src={item.imageUrl} alt={item.name} width={60} height={75} className="rounded-md object-cover" />
                            <div className="flex-1">
                                <p className="font-medium line-clamp-1">{item.name}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
