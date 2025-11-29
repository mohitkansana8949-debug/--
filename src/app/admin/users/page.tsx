'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, Edit } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
    const { firestore } = useFirebase();
    const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

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
                                <TableCell>
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/admin/users/${user.id}`}>
                                            <Edit className="mr-2 h-3 w-3" />
                                            Manage
                                        </Link>
                                    </Button>
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
