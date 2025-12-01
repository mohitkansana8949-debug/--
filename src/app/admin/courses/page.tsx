
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function AdminCoursesPage() {
    const { firestore } = useFirebase();
    const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
    const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Courses</CardTitle>
                <CardDescription>View and manage all courses and their bundled test series.</CardDescription>
            </CardHeader>
            <CardContent>
                {coursesLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Course Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Content Items</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses?.map(course => (
                                <TableRow key={course.id}>
                                    <TableCell className='font-medium'>{course.name}</TableCell>
                                    <TableCell>{course.isFree ? 'Free' : `₹${course.price}`}</TableCell>
                                    <TableCell>{course.content?.length || 0}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button asChild size="sm">
                                            <Link href={`/admin/content/${course.id}`}>Manage Content</Link>
                                        </Button>
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/courses/${course.id}`}>View</Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!coursesLoading && courses?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No courses found.
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
