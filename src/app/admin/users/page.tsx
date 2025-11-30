
'use client';
import { useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
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
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AdminUsersPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

    const adminsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'roles_admin') : null), [firestore]);
    const { data: admins, isLoading: adminsLoading } = useCollection(adminsQuery);
    
    const adminUids = useMemoFirebase(() => new Set(admins?.map(admin => admin.id)), [admins]);

    const handleAdminToggle = async (userId: string, currentIsAdmin: boolean) => {
        if (!firestore) return;
        
        const adminDocRef = doc(firestore, 'roles_admin', userId);
        
        if (currentIsAdmin) {
            // Revoke admin: delete the document
            deleteDoc(adminDocRef)
                .then(() => {
                    toast({ title: 'Admin Revoked', description: 'User is no longer an admin.' });
                })
                .catch((error) => {
                    console.error("Error revoking admin status:", error);
                    const contextualError = new FirestorePermissionError({
                        operation: 'delete',
                        path: adminDocRef.path
                    });
                    errorEmitter.emit('permission-error', contextualError);
                });
        } else {
            // Grant admin: create the document
            const roleData = { role: 'admin' };
            setDoc(adminDocRef, roleData)
                .then(() => {
                    toast({ title: 'Admin Granted', description: 'User is now an admin.' });
                })
                .catch((error) => {
                    console.error("Error granting admin status:", error);
                    const contextualError = new FirestorePermissionError({
                        operation: 'create',
                        path: adminDocRef.path,
                        requestResourceData: roleData
                    });
                    errorEmitter.emit('permission-error', contextualError);
                });
        }
    };

    const isLoading = usersLoading || adminsLoading;

    return (
        <Card>
            <CardHeader><CardTitle>सभी यूज़र्स</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={5} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                        {users?.map(user => {
                            const isCurrentUserAdmin = adminUids.has(user.id);
                            return (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                    <TableCell>{user.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'suspended' ? 'destructive' : 'success'}>
                                            {user.status || 'active'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id={`admin-switch-${user.id}`}
                                                checked={isCurrentUserAdmin}
                                                onCheckedChange={() => handleAdminToggle(user.id, isCurrentUserAdmin)}
                                                disabled={user.email === 'Qukly@study.com'}
                                            />
                                            <Label htmlFor={`admin-switch-${user.id}`}>{isCurrentUserAdmin ? 'Admin' : 'User'}</Label>
                                        </div>
                                    </TableCell>
                                    <TableCell className="space-x-2">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/admin/users/${user.id}`}>
                                                <Edit className="mr-2 h-3 w-3" />
                                                Manage
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                         {!isLoading && users?.length === 0 && (
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
