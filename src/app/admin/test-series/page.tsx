
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, PackagePlus, Newspaper, Trash2, Edit } from 'lucide-react';
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

function AddTestToCourseDialog({ testId, testName }: { testId: string, testName: string }) {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [selectedCourse, setSelectedCourse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
    const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);

    const handleAddToCourse = async () => {
        if (!selectedCourse) {
            toast({ variant: "destructive", title: "Error", description: "Please select a course." });
            return;
        }
        setIsSubmitting(true);
        const testRef = doc(firestore, 'tests', testId);

        try {
            await updateDoc(testRef, {
                bundledCourseId: selectedCourse,
            });
            toast({ title: "Success!", description: `"${testName}" is now bundled with the selected course.` });
            setSelectedCourse(''); // Reset for next time
            // We don't close the dialog here, DialogClose will handle it
        } catch (error) {
            console.error("Error bundling test:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not bundle test with course." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleRemoveFromCourse = async () => {
         setIsSubmitting(true);
        const testRef = doc(firestore, 'tests', testId);

        try {
            await updateDoc(testRef, {
                bundledCourseId: null,
            });
            toast({ title: "Success!", description: `"${testName}" has been unbundled.` });
        } catch (error) {
            console.error("Error unbundling test:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not unbundle test." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="secondary"><PackagePlus className="mr-2 h-4 w-4"/>Add to Course</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add "{testName}" to a Course</DialogTitle>
                    <DialogDescription>
                        When a student enrolls in the selected course, they will automatically get this test series for free.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Select onValueChange={setSelectedCourse} value={selectedCourse}>
                        <SelectTrigger>
                            <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course to bundle with"} />
                        </SelectTrigger>
                        <SelectContent>
                            {courses?.map(course => (
                                <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter className="sm:justify-between">
                    <Button variant="destructive" onClick={handleRemoveFromCourse} disabled={isSubmitting}>
                        Remove from Course
                    </Button>
                    <div className="flex gap-2">
                        <DialogClose asChild><Button type="button" variant="secondary">Close</Button></DialogClose>
                        <Button type="button" onClick={handleAddToCourse} disabled={isSubmitting || !selectedCourse}>
                            {isSubmitting ? <Loader className="animate-spin" /> : "Save"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminTestSeriesPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const testsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'tests') : null), [firestore]);
    const { data: tests, isLoading: testsLoading } = useCollection(testsQuery);
    
    const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
    const { data: courses } = useCollection(coursesQuery);
    const coursesMap = new Map(courses?.map(c => [c.id, c.name]));

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'tests', id));
            toast({ title: "Success", description: "Test Series deleted successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete test series." });
            console.error("Error deleting test series:", error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Test Series</CardTitle>
                <CardDescription>View and manage all test series. You can bundle them with courses to offer them for free.</CardDescription>
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
                                <TableHead>Questions</TableHead>
                                <TableHead>Bundled With</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tests?.map(test => (
                                <TableRow key={test.id}>
                                    <TableCell className='font-medium'>{test.name}</TableCell>
                                    <TableCell>{test.isFree ? 'Free' : `₹${test.price}`}</TableCell>
                                    <TableCell>{test.questions?.length || 0}</TableCell>
                                    <TableCell>{test.bundledCourseId ? coursesMap.get(test.bundledCourseId) : 'None'}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/admin/edit-test/${test.id}`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
                                        </Button>
                                        <AddTestToCourseDialog testId={test.id} testName={test.name} />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete this test series.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(test.id)}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!testsLoading && tests?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground p-8">
                                       <Newspaper className="mx-auto h-12 w-12" />
                                       <p className="mt-4">No tests found.</p>
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
