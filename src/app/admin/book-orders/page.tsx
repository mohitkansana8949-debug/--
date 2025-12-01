
'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, getDoc, getDocs, where } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, Package, ChevronRight, ShoppingBag, Eye } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function UpdateOrderDialog({ order }: { order: any }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [status, setStatus] = useState(order.status);
    const [trackingId, setTrackingId] = useState(order.trackingId || '');
    const [trackingUrl, setTrackingUrl] = useState(order.trackingUrl || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdate = async () => {
        if (!firestore) return;
        setIsSubmitting(true);
        const orderRef = doc(firestore, 'bookOrders', order.id);
        try {
            await updateDoc(orderRef, {
                status,
                trackingId,
                trackingUrl
            });
            toast({ title: "Success", description: "Order updated successfully." });
        } catch (error) {
            console.error("Order update error:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update order." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm">Manage</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Order #{order.id.substring(0, 6)}</DialogTitle>
                    <DialogDescription>Update status and tracking information for this order.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="status-select">Order Status</Label>
                        <Select onValueChange={setStatus} defaultValue={status}>
                            <SelectTrigger id="status-select">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Shipped">Shipped</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tracking-id">Tracking ID</Label>
                        <Input id="tracking-id" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="tracking-url">Tracking URL</Label>
                        <Input id="tracking-url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleUpdate} disabled={isSubmitting}>
                        {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Update Order
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function AdminBookOrdersPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirestore();
    const [hasPermission, setHasPermission] = useState(false);
    const [isPermissionLoading, setIsPermissionLoading] = useState(true);

    useEffect(() => {
        const checkPermissions = async () => {
            if (user && firestore) {
                const adminRef = doc(firestore, 'roles_admin', user.uid);
                const bookManagerRef = doc(firestore, 'roles_book_manager', user.uid);
                
                const [adminDoc, bookManagerDoc] = await Promise.all([
                    getDoc(adminRef),
                    getDoc(bookManagerRef)
                ]);

                if (adminDoc.exists() || bookManagerDoc.exists()) {
                    setHasPermission(true);
                } else {
                    setHasPermission(false);
                }
            } else {
                setHasPermission(false);
            }
            setIsPermissionLoading(false);
        }
        if(!isUserLoading) {
            checkPermissions();
        }
    }, [user, firestore, isUserLoading]);

    const ordersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'bookOrders'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);
    
    const isLoading = isUserLoading || isPermissionLoading;

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Shipped': return 'secondary';
            case 'Delivered': return 'success';
            case 'Cancelled': return 'destructive';
            default: return 'default';
        }
    };

    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader className="animate-spin" /></div>;
    }
    
    if (!hasPermission) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You do not have permission to view this page.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Book Orders</CardTitle>
                <CardDescription>View and manage all book orders placed by users.</CardDescription>
            </CardHeader>
            <CardContent>
                 {ordersLoading && !orders ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>User ID</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders?.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className='font-mono text-xs'>{order.id.substring(0, 6)}</TableCell>
                                    <TableCell>{order.createdAt?.toDate ? format(order.createdAt.toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                    <TableCell className="font-mono text-xs">{order.userId.substring(0, 6)}</TableCell>
                                    <TableCell>₹{order.total.toFixed(2)}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(order.status)}>{order.status}</Badge></TableCell>
                                    <TableCell className="space-x-2">
                                        <Button asChild variant="outline" size="icon"><Link href={`/my-orders/${order.id}`} target="_blank"><Eye className="h-4 w-4" /></Link></Button>
                                        <UpdateOrderDialog order={order} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!ordersLoading && orders?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground p-8">
                                      <ShoppingBag className="mx-auto h-12 w-12" />
                                      <p className="mt-4">No book orders found.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
