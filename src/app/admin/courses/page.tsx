
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Edit, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

export default function AdminCoursesPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
    const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
    
    const handleDeleteCourse = async (courseId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'courses', courseId));
            toast({ title: "Success", description: "Course deleted successfully." });
        } catch (error) {
            console.error("Error deleting course:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to delete the course." });
        }
    };
    
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
                                            <Link href={`/admin/edit-course/${course.id}`}><Edit className="mr-2 h-4 w-4"/>Edit</Link>
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete this course and all its content.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
