
'use client';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, Package, ArrowLeft, Truck, Home, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

export default function OrderDetailsPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { orderId } = useParams();
    const router = useRouter();

    const orderRef = useMemoFirebase(() => (
        user && firestore && orderId ? doc(firestore, 'bookOrders', orderId as string) : null
    ), [user, firestore, orderId]);

    const { data: order, isLoading } = useDoc(orderRef);
    
    // Admin check
    const adminRef = useMemoFirebase(() => (
        user && firestore ? doc(firestore, 'roles_admin', user.uid) : null
    ), [user, firestore]);
    const { data: adminDoc } = useDoc(adminRef);
    const isAdmin = !!adminDoc;

    if (isLoading || isUserLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
    }
    
    if (!order) {
        return <div className="flex h-screen items-center justify-center">Order not found.</div>
    }

    // Security check: Only the user who placed the order OR an admin can view it.
    if (order.userId !== user?.uid && !isAdmin) {
        router.replace('/my-purchases'); // Or a more appropriate page like '/
        return null;
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Shipped': return 'secondary';
            case 'Delivered': return 'success';
            case 'Cancelled': return 'destructive';
            default: return 'default';
        }
    };
    
    const getTimelineStep = (status: string) => {
        switch (status) {
            case 'Pending': return 1;
            case 'Shipped': return 2;
            case 'Delivered': return 3;
            default: return 0;
        }
    }
    
    const timelineStep = getTimelineStep(order.status);

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <Button asChild variant="outline" className="mb-4">
                <Link href="/my-purchases"><ArrowLeft className="mr-2"/>Back to Orders</Link>
            </Button>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                             <CardTitle>Order #{order.id.substring(0, 6)}</CardTitle>
                             <CardDescription>Placed on {format(order.createdAt.toDate(), 'MMMM d, yyyy')}</CardDescription>
                        </div>
                        <Badge variant={getStatusVariant(order.status)} className="text-base">{order.status}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    
                     <div className="flex justify-between items-center text-center text-sm w-full max-w-lg mx-auto">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${timelineStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><Package size={16}/></div>
                            <p>Pending</p>
                        </div>
                        <Separator className={`flex-1 ${timelineStep > 1 ? 'bg-primary' : ''}`} />
                        <div className="flex flex-col items-center gap-1">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${timelineStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><Truck size={16}/></div>
                            <p>Shipped</p>
                        </div>
                         <Separator className={`flex-1 ${timelineStep > 2 ? 'bg-primary' : ''}`} />
                        <div className="flex flex-col items-center gap-1">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${timelineStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}><CheckCircle size={16}/></div>
                            <p>Delivered</p>
                        </div>
                    </div>
                    
                    {order.trackingUrl && (
                        <div className="text-center">
                            <Button asChild>
                                <Link href={order.trackingUrl} target="_blank">Track Shipment</Link>
                            </Button>
                            {order.trackingId && <p className="text-xs text-muted-foreground mt-2">Tracking ID: {order.trackingId}</p>}
                        </div>
                    )}
                    
                    <Separator/>

                    <div>
                        <h3 className="font-semibold mb-2">Items Ordered</h3>
                        <div className="space-y-4">
                            {order.items.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <Image src={item.imageUrl} alt={item.name} width={60} height={75} className="rounded-md object-cover" />
                                    <div className="flex-1">
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <Separator/>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <h3 className="font-semibold mb-2">Shipping Address</h3>
                             <div className="text-sm text-muted-foreground">
                                <p>{order.address.name}</p>
                                <p>{order.address.address}</p>
                                <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                                <p>Mobile: {order.address.mobile}</p>
                            </div>
                        </div>
                         <div>
                             <h3 className="font-semibold mb-2">Order Summary</h3>
                             <div className="text-sm space-y-1">
                                <div className="flex justify-between"><span>Subtotal:</span><span>₹{order.subtotal.toFixed(2)}</span></div>
                                {order.discount > 0 && <div className="flex justify-between text-green-500"><span>Discount ({order.appliedCoupon?.code}):</span><span>- ₹{order.discount.toFixed(2)}</span></div>}
                                <div className="flex justify-between"><span>Shipping:</span><span>Free</span></div>
                                <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Total:</span><span>₹{order.total.toFixed(2)}</span></div>
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
