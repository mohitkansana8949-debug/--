
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminTestSeriesPage() {
    const { firestore } = useFirebase();
    const testsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'tests') : null), [firestore]);
    const { data: tests, isLoading: testsLoading } = useCollection(testsQuery);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Test Series</CardTitle>
                <CardDescription>View and manage all test series.</CardDescription>
            </CardHeader>
            <CardContent>
                {testsLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Test Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Questions</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tests?.map(test => (
                                <TableRow key={test.id}>
                                    <TableCell className='font-medium'>{test.name}</TableCell>
                                    <TableCell>{test.isFree ? 'Free' : `₹${test.price}`}</TableCell>
                                    <TableCell>{test.duration} mins</TableCell>
                                    <TableCell>{test.questions?.length || 0}</TableCell>
                                    <TableCell>
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/test-series/${test.id}`} target="_blank">View Test</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!testsLoading && tests?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No tests found.
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
