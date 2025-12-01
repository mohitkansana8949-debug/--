
'use client';

import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, CheckCircle, XCircle, Clock, TicketPercent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

type EnrichedEnrollment = {
  id: string;
  userName: string;
  itemName: string;
  itemType: string;
  status: 'approved' | 'pending' | 'rejected';
  paymentTransactionId: string;
  enrollmentDate: any;
  appliedCoupon?: {
    code: string;
    discountAmount: number;
  }
};

export default function AdminEnrollmentsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const enrollmentsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'enrollments'), orderBy('enrollmentDate', 'desc')) : null), [firestore]);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

  const [enrichedEnrollments, setEnrichedEnrollments] = useState<EnrichedEnrollment[]>([]);
  const [isEnriching, setIsEnriching] = useState(true);

  const enrichData = useCallback(async () => {
    if (!enrollments || !firestore) {
      if (!enrollmentsLoading) setIsEnriching(false);
      return;
    }
    setIsEnriching(true);
    
    try {
      const userIds = [...new Set(enrollments.map(e => e.userId).filter(Boolean))];
      
      const usersSnap = userIds.length > 0 ? await getDocs(query(collection(firestore, 'users'), where('__name__', 'in', userIds))) : { docs: [] };

      const usersMap = new Map(usersSnap.docs.map(d => [d.id, d.data().name || 'Unknown User']));

      const enriched = enrollments.map(e => ({
        id: e.id,
        userName: usersMap.get(e.userId) || e.userId.substring(0, 6),
        itemName: e.itemName || 'Unknown Item',
        itemType: e.itemType || 'N/A',
        status: e.status,
        paymentTransactionId: e.paymentTransactionId,
        enrollmentDate: e.enrollmentDate,
        appliedCoupon: e.appliedCoupon
      }));

      setEnrichedEnrollments(enriched);
    } catch (e) {
        console.error("Error enriching enrollment data:", e);
        toast({variant: 'destructive', title: 'Error', description: 'Could not load full enrollment details.'})
    } finally {
        setIsEnriching(false);
    }
  }, [enrollments, firestore, enrollmentsLoading, toast]);

  useEffect(() => {
    enrichData();
  }, [enrichData]);

  const handleEnrollmentStatusChange = async (enrollmentId: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;

    setUpdatingId(enrollmentId);
    const enrollmentRef = doc(firestore, 'enrollments', enrollmentId);
    const updateData = { status: status };

    updateDoc(enrollmentRef, updateData)
      .then(() => {
        toast({ title: 'सफलता!', description: `एनरोलमेंट को ${status} के रूप में अपडेट कर दिया गया है।`});
      })
      .catch((error) => {
        const contextualError = new FirestorePermissionError({
          operation: 'update',
          path: enrollmentRef.path,
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setUpdatingId(null);
      });
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved': return <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
        case 'pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
        case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  }

  const finalLoading = enrollmentsLoading || isEnriching;

  return (
    <Card>
        <CardHeader>
            <CardTitle>सभी एनरोलमेंट्स</CardTitle>
            <CardDescription>View and approve all pending enrollments for courses, e-books, etc.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Item</TableHead><TableHead>Payment No.</TableHead><TableHead>Coupon</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {finalLoading && <TableRow><TableCell colSpan={7} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                    {enrichedEnrollments.map(enrollment => (
                        <TableRow key={enrollment.id}>
                            <TableCell className="text-xs">{enrollment.enrollmentDate ? format(enrollment.enrollmentDate.toDate(), 'dd MMM, HH:mm') : 'N/A'}</TableCell>
                            <TableCell className="font-medium">{enrollment.userName}</TableCell>
                            <TableCell>{enrollment.itemName}</TableCell>
                            <TableCell>{enrollment.paymentTransactionId}</TableCell>
                            <TableCell>
                                {enrollment.appliedCoupon ? (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                        <TicketPercent className="h-3 w-3"/>
                                        {enrollment.appliedCoupon.code}
                                    </Badge>
                                ) : 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                            <TableCell className="space-x-2">
                                <Button size="sm" variant="success" onClick={() => handleEnrollmentStatusChange(enrollment.id, 'approved')} disabled={updatingId === enrollment.id || enrollment.status === 'approved'}>
                                    {updatingId === enrollment.id ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : 'Approve'}
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleEnrollmentStatusChange(enrollment.id, 'rejected')} disabled={updatingId === enrollment.id || enrollment.status === 'rejected'}>
                                    {updatingId === enrollment.id ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : 'Reject'}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                     {!finalLoading && enrichedEnrollments.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground p-8">
                                कोई एनरोलमेंट नहीं मिला।
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  )
}
