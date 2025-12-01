
'use client';
import { useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Edit, Trash2, ShoppingBag } from 'lucide-react';
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

    const bookManagersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'roles_book_manager') : null), [firestore]);
    const { data: bookManagers, isLoading: bookManagersLoading } = useCollection(bookManagersQuery);
    
    const adminUids = useMemoFirebase(() => new Set(admins?.map(admin => admin.id)), [admins]);
    const bookManagerUids = useMemoFirebase(() => new Set(bookManagers?.map(manager => manager.id)), [bookManagers]);

    const handleRoleToggle = async (userId: string, role: 'admin' | 'book_manager', currentIsRole: boolean) => {
        if (!firestore) return;
        
        const roleCollectionName = `roles_${role}`;
        const roleDocRef = doc(firestore, roleCollectionName, userId);
        const roleName = role === 'admin' ? 'Admin' : 'Book Manager';
        
        if (currentIsRole) {
            deleteDoc(roleDocRef)
                .then(() => {
                    toast({ title: 'Role Revoked', description: `User is no longer a ${roleName}.` });
                })
                .catch((error) => {
                    console.error(`Error revoking ${roleName} status:`, error);
                    const contextualError = new FirestorePermissionError({
                        operation: 'delete',
                        path: roleDocRef.path
                    });
                    errorEmitter.emit('permission-error', contextualError);
                });
        } else {
            const roleData = { role: role, assignedAt: new Date() };
            setDoc(roleDocRef, roleData)
                .then(() => {
                    toast({ title: 'Role Granted', description: `User is now a ${roleName}.` });
                })
                .catch((error) => {
                    console.error(`Error granting ${roleName} status:`, error);
                    const contextualError = new FirestorePermissionError({
                        operation: 'create',
                        path: roleDocRef.path,
                        requestResourceData: roleData
                    });
                    errorEmitter.emit('permission-error', contextualError);
                });
        }
    };

    const isLoading = usersLoading || adminsLoading || bookManagersLoading;

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
                            <TableHead>Roles</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={5} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                        {users?.map(user => {
                            const isCurrentUserAdmin = adminUids.has(user.id);
                            const isCurrentUserBookManager = bookManagerUids.has(user.id);
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
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id={`admin-switch-${user.id}`}
                                                    checked={isCurrentUserAdmin}
                                                    onCheckedChange={() => handleRoleToggle(user.id, 'admin', isCurrentUserAdmin)}
                                                    disabled={user.email?.toLowerCase() === 'qukly@study.com'}
                                                    className="data-[state=checked]:bg-destructive"
                                                />
                                                <Label htmlFor={`admin-switch-${user.id}`}>Admin</Label>
                                            </div>
                                             <div className="flex items-center space-x-2">
                                                <Switch
                                                    id={`book-manager-switch-${user.id}`}
                                                    checked={isCurrentUserBookManager}
                                                    onCheckedChange={() => handleRoleToggle(user.id, 'book_manager', isCurrentUserBookManager)}
                                                    className="data-[state=checked]:bg-blue-600"
                                                />
                                                <Label htmlFor={`book-manager-switch-${user.id}`}>Book Manager</Label>
                                            </div>
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
