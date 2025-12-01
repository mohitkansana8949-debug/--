
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Trash2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { format } from 'date-fns';
import Image from 'next/image';

export default function AdminResultsPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const resultsQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'results'), orderBy('submittedAt', 'desc')) : null), [firestore]);
    const { data: results, isLoading } = useCollection(resultsQuery);

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'results', id));
            toast({ title: "Success", description: "Result submission deleted successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete result submission." });
            console.error("Error deleting result:", error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Submitted Results</CardTitle>
                <CardDescription>Review success stories submitted by students.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Exam</TableHead>
                                <TableHead>Roll No.</TableHead>
                                <TableHead>Mobile</TableHead>
                                <TableHead>Submitted At</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results?.map(result => (
                                <TableRow key={result.id}>
                                    <TableCell className='font-medium'>{result.name}</TableCell>
                                    <TableCell>{result.examName}</TableCell>
                                    <TableCell>{result.rollNumber}</TableCell>
                                    <TableCell>{result.mobile}</TableCell>
                                    <TableCell>{result.submittedAt ? format(result.submittedAt.toDate(), 'dd MMM yyyy') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete this submission.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(result.id)}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && results?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground p-8">
                                      <UserCheck className="mx-auto h-12 w-12" />
                                      <p className="mt-4">No results have been submitted yet.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
