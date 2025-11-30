
'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, Package, ChevronRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function MyOrdersPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const ordersQuery = useMemoFirebase(() => (
        user && firestore ? query(
            collection(firestore, 'bookOrders'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        ) : null
    ), [user, firestore]);

    const { data: orders, isLoading, error } = useCollection(ordersQuery);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Shipped': return 'secondary';
            case 'Delivered': return 'success';
            case 'Cancelled': return 'destructive';
            default: return 'default';
        }
    };

    if (isLoading || isUserLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin" /></div>;
    }
    
    if (error) {
        return (
            <div className="flex h-screen items-center justify-center text-red-500">
                <p>Error loading orders: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl">
             <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <ShoppingBag className="h-8 w-8" />
                    Your Orders
                </h1>
                <p className="text-muted-foreground">
                    Track all your book purchases here.
                </p>
            </div>
            
            {orders && orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map(order => (
                        <Card key={order.id} className="hover:bg-muted/50">
                             <Link href={`/my-orders/${order.id}`}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm text-muted-foreground">Order #{order.id.substring(0, 6)}</p>
                                        <p className="font-semibold">Placed on {format(order.createdAt.toDate(), 'MMMM d, yyyy')}</p>
                                        <p className="font-bold text-lg">₹{order.total.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                                        <Button variant="outline" size="sm">
                                            Track Your Order
                                            <ChevronRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </div>
                                </CardContent>
                             </Link>
                        </Card>
                    ))}
                </div>
            ) : (
                 <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <Package className="h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold">No orders yet</h3>
                        <p>You haven't placed any book orders.</p>
                        <Button asChild className="mt-4">
                            <Link href="/bookshala">Start Shopping</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
