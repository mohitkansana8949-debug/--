
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Trash2, TicketPercent, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function AdminCouponsPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const couponsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'coupons'), orderBy('createdAt', 'desc')) : null), [firestore]);
    const { data: coupons, isLoading: couponsLoading } = useCollection(couponsQuery);
    
    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'coupons', id));
            toast({ title: "Success", description: "Coupon deleted successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete coupon." });
            console.error("Error deleting coupon:", error);
        }
    };


    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-center">
                 <div>
                    <CardTitle>Manage Coupons</CardTitle>
                    <CardDescription>View, create, and manage all discount coupons.</CardDescription>
                </div>
                <Button asChild><Link href="/admin/create-coupon"><PlusCircle className="mr-2"/> Add Coupon</Link></Button>
            </CardHeader>
            <CardContent>
                {couponsLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Discount</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {coupons?.map(coupon => (
                                <TableRow key={coupon.id}>
                                    <TableCell><Badge variant="secondary" className="font-mono">{coupon.code}</Badge></TableCell>
                                    <TableCell className='font-medium'>
                                        {coupon.discountType === 'percentage' 
                                            ? `${coupon.discountValue}%` 
                                            : `₹${coupon.discountValue}`}
                                    </TableCell>
                                     <TableCell>{coupon.expiresAt ? format(coupon.expiresAt.toDate(), 'dd MMM yyyy, HH:mm') : 'Never'}</TableCell>
                                     <TableCell>
                                        {coupon.uses || 0}
                                        {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                                    </TableCell>
                                    <TableCell className="space-x-2">
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete this coupon.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(coupon.id)}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!couponsLoading && coupons?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground p-8">
                                       <TicketPercent className="mx-auto h-12 w-12" />
                                       <p className="mt-4">No coupons found.</p>
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
