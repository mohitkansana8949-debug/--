
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function AdminUsersPage() {
    const { firestore } = useFirebase();
    const usersQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

    return (
        <Card>
            <CardHeader><CardTitle>सभी यूज़र्स</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>UID</TableHead><TableHead>Email</TableHead><TableHead>Name</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {usersLoading && <TableRow><TableCell colSpan={3} className="text-center"><Loader className="mx-auto animate-spin" /></TableCell></TableRow>}
                        {users?.map(user => (<TableRow key={user.id}><TableCell className="font-mono text-xs">{user.id}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.name || 'N/A'}</TableCell></TableRow>))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
