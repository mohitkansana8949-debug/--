
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminManageContentPage() {
    const { firestore } = useFirebase();
    const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
    const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);

    return (
        <Card>
            <CardHeader><CardTitle>कंटेंट मैनेज करें</CardTitle></CardHeader>
            <CardContent>
                {coursesLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>कोर्स का नाम</TableHead>
                                <TableHead>एक्शन</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses?.map(course => (
                                <TableRow key={course.id}>
                                    <TableCell className='font-medium'>{course.name}</TableCell>
                                    <TableCell>
                                        <Button asChild>
                                            <Link href={`/admin/content/${course.id}`}>मैनेज कंटेंट</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!coursesLoading && courses?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                                        कोई कोर्स नहीं मिला।
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
