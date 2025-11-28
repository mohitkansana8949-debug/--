
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <CardHeader><CardTitle>All Test Series</CardTitle></CardHeader>
            <CardContent>
                {testsLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Test Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tests?.map(test => (
                                <TableRow key={test.id}>
                                    <TableCell className='font-medium'>{test.name}</TableCell>
                                    <TableCell>{test.isFree ? 'Free' : `₹${test.price}`}</TableCell>
                                    <TableCell>
                                        <Button asChild>
                                            <Link href={`/test-series/${test.id}`}>View Test</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!testsLoading && tests?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
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
