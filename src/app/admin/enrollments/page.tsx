
'use client';

import { useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


export default function AdminEnrollmentsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const enrollmentsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courseEnrollments') : null), [firestore]);
  const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

  const handleEnrollmentStatusChange = async (enrollmentId: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;

    const enrollmentRef = doc(firestore, 'courseEnrollments', enrollmentId);
    try {
        const updateData = { status: status };
        await updateDoc(enrollmentRef, updateData);
        toast({ title: 'सफलता!', description: `एनरोलमेंट को ${status} के रूप में अपडेट कर दिया गया है।`});
    } catch (error) {
        console.error("Enrollment update error:", error);
        toast({ variant: 'destructive', title: 'त्रुटि', description: 'एनरोलमेंट स्थिति को अपडेट करने में विफल।'});
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved': return <Badge variant="success"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
        case 'pending': return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
        case 'rejected': return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
        default: return <Badge>{status}</Badge>;
    }
  }

  return (
    <Card>
        <CardHeader><CardTitle>सभी एनरोलमेंट्स</CardTitle></CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Enrollment ID</TableHead><TableHead>User ID</TableHead><TableHead>Course ID</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                    {enrollmentsLoading && <TableRow><TableCell colSpan={5} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                    {enrollments?.map(enrollment => (
                        <TableRow key={enrollment.id}>
                            <TableCell className="font-mono text-xs">{enrollment.id}</TableCell>
                            <TableCell className="font-mono text-xs">{enrollment.userId}</TableCell>
                            <TableCell className="font-mono text-xs">{enrollment.courseId}</TableCell>
                            <TableCell>{getStatusBadge(enrollment.status)}</TableCell>
                            <TableCell className="space-x-2">
                                {enrollment.status !== 'approved' && <Button size="sm" variant="success" onClick={() => handleEnrollmentStatusChange(enrollment.id, 'approved')}>Approve</Button>}
                                {enrollment.status !== 'rejected' && <Button size="sm" variant="destructive" onClick={() => handleEnrollmentStatusChange(enrollment.id, 'rejected')}>Reject</Button>}
                            </TableCell>
                        </TableRow>
                    ))}
                     {!enrollmentsLoading && enrollments?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
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
