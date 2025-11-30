
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

    const handleDeleteUser = async (userId: string) => {
        if (!firestore) return;

        try {
            await deleteDoc(doc(firestore, 'users', userId));
            toast({ title: "Success", description: "User has been deleted permanently."});
            // Note: In a real app, you might want to delete associated Firebase Auth user too via a Cloud Function.
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Failed to delete user."});
            console.error("Error deleting user: ", error);
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle>सभी यूज़र्स</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usersLoading && <TableRow><TableCell colSpan={5} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                        {users?.map(user => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                <TableCell>{user.email || 'N/A'}</TableCell>
                                <TableCell>{user.mobile || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant={user.status === 'suspended' ? 'destructive' : 'success'}>
                                        {user.status || 'active'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="space-x-2">
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/admin/users/${user.id}`}>
                                            <Edit className="mr-2 h-3 w-3" />
                                            Manage
                                        </Link>
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the user and all their associated data. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                         {!usersLoading && users?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    कोई यूज़र नहीं मिला।
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
