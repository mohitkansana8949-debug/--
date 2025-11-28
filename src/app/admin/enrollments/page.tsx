
'use client';

import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { useState, useEffect, useCallback } from 'react';

type EnrichedEnrollment = {
  id: string;
  userName: string;
  itemName: string;
  itemType: string;
  status: 'approved' | 'pending' | 'rejected';
  paymentTransactionId: string;
};

export default function AdminEnrollmentsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const enrollmentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'enrollments') : null), [firestore]);
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
      const courseIds = [...new Set(enrollments.filter(e => e.itemType === 'course').map(e => e.itemId))];
      const ebookIds = [...new Set(enrollments.filter(e => e.itemType === 'ebook').map(e => e.itemId))];
      const pyqIds = [...new Set(enrollments.filter(e => e.itemType === 'pyq').map(e => e.itemId))];
      const testIds = [...new Set(enrollments.filter(e => e.itemType === 'test').map(e => e.itemId))];
      
      const [usersSnap, coursesSnap, ebooksSnap, pyqsSnap, testsSnap] = await Promise.all([
        userIds.length > 0 ? getDocs(query(collection(firestore, 'users'), where('__name__', 'in', userIds))) : Promise.resolve({ docs: [] }),
        courseIds.length > 0 ? getDocs(query(collection(firestore, 'courses'), where('__name__', 'in', courseIds))) : Promise.resolve({ docs: [] }),
        ebookIds.length > 0 ? getDocs(query(collection(firestore, 'ebooks'), where('__name__', 'in', ebookIds))) : Promise.resolve({ docs: [] }),
        pyqIds.length > 0 ? getDocs(query(collection(firestore, 'pyqs'), where('__name__', 'in', pyqIds))) : Promise.resolve({ docs: [] }),
        testIds.length > 0 ? getDocs(query(collection(firestore, 'tests'), where('__name__', 'in', testIds))) : Promise.resolve({ docs: [] }),
      ]);

      const usersMap = new Map(usersSnap.docs.map(d => [d.id, d.data().name || 'Unknown User']));
      const itemsMap = new Map([
          ...coursesSnap.docs.map(d => [d.id, d.data().name || 'Unknown Course']),
          ...ebooksSnap.docs.map(d => [d.id, d.data().name || 'Unknown E-book']),
          ...pyqsSnap.docs.map(d => [d.id, d.data().name || 'Unknown PYQ']),
          ...testsSnap.docs.map(d => [d.id, d.data().name || 'Unknown Test']),
      ]);

      const enriched = enrollments.map(e => ({
        id: e.id,
        userName: usersMap.get(e.userId) || e.userId,
        itemName: itemsMap.get(e.itemId) || e.itemId,
        itemType: e.itemType || 'N/A',
        status: e.status,
        paymentTransactionId: e.paymentTransactionId,
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
        <CardHeader><CardTitle>सभी एनरोलमेंट्स</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Payment No.</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {finalLoading && <TableRow><TableCell colSpan={6} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                    {enrichedEnrollments.map(enrollment => (
                        <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">{enrollment.userName}</TableCell>
                            <TableCell>{enrollment.itemName}</TableCell>
                            <TableCell><Badge variant="outline">{enrollment.itemType}</Badge></TableCell>
                            <TableCell>{enrollment.paymentTransactionId}</TableCell>
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
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
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
