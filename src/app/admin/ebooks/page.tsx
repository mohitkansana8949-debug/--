
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Trash2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

export default function AdminEbooksPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const ebooksQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'ebooks') : null), [firestore]);
    const { data: ebooks, isLoading: ebooksLoading } = useCollection(ebooksQuery);

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'ebooks', id));
            toast({ title: "Success", description: "E-book deleted successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete e-book." });
            console.error("Error deleting e-book:", error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage E-books</CardTitle>
                <CardDescription>View and manage all e-books.</CardDescription>
            </CardHeader>
            <CardContent>
                {ebooksLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ebooks?.map(ebook => (
                                <TableRow key={ebook.id}>
                                    <TableCell className='font-medium'>{ebook.name}</TableCell>
                                    <TableCell>{ebook.isFree ? 'Free' : `₹${ebook.price}`}</TableCell>
                                    <TableCell className="space-x-2">
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/pdf-viewer?url=${encodeURIComponent(ebook.pdfUrl)}`} target="_blank">View</Link>
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete this e-book.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(ebook.id)}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!ebooksLoading && ebooks?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        No e-books found.
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
