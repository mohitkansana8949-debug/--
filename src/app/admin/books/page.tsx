
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Trash2, Package } from 'lucide-react';
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
import Image from 'next/image';

export default function AdminBooksPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const booksQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'books') : null), [firestore]);
    const { data: books, isLoading: booksLoading } = useCollection(booksQuery);

    const handleDelete = async (id: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'books', id));
            toast({ title: "Success", description: "Book deleted successfully." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete book." });
            console.error("Error deleting book:", error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Books</CardTitle>
                <CardDescription>View and manage all physical books for Bookshala.</CardDescription>
            </CardHeader>
            <CardContent>
                {booksLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Offer</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {books?.map(book => (
                                <TableRow key={book.id}>
                                    <TableCell>
                                        <Image src={book.imageUrl} alt={book.name} width={40} height={50} className="rounded-sm object-cover" />
                                    </TableCell>
                                    <TableCell className='font-medium'>{book.name}</TableCell>
                                    <TableCell>₹{book.price}</TableCell>
                                    <TableCell>{book.offer || 'N/A'}</TableCell>
                                    <TableCell className="space-x-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="icon" variant="destructive"><Trash2 className="h-4 w-4"/></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This action cannot be undone. This will permanently delete this book.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(book.id)}>Continue</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!booksLoading && books?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground p-8">
                                      <Package className="mx-auto h-12 w-12" />
                                      <p className="mt-4">No books found.</p>
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
