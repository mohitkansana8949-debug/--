'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, ArrowLeft, User, Mail, Phone, MapPin, BookCopy, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export default function ManageUserPage() {
    const { userId } = useParams();
    const router = useRouter();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const userRef = useMemoFirebase(() => (firestore && userId ? doc(firestore, 'users', userId as string) : null), [firestore, userId]);
    const { data: user, isLoading: userLoading, error } = useDoc(userRef);

    const handleStatusChange = async (newStatus: 'active' | 'suspended') => {
        if (!userRef) return;
        
        const updateData = { status: newStatus };
        try {
            await updateDoc(userRef, updateData);
            toast({
                title: 'Success!',
                description: `User has been ${newStatus}.`,
            });
        } catch (e) {
            console.error("Failed to update user status", e);
            const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: userRef.path,
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', contextualError);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update user status.',
            });
        }
    };

    const ProfileInfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | undefined | null }) => (
    value ? (
        <div className="flex items-start gap-3">
            <div className="text-muted-foreground mt-1">{icon}</div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    ) : null
  );

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="p-4 border-b flex items-center gap-4">
                <Button asChild variant="outline">
                    <Link href="/admin/users">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Users
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold">Manage User</h1>
            </header>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {userLoading ? (
                    <Card className="max-w-2xl mx-auto"><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
                ) : user ? (
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">{user.name} <Badge variant={user.status === 'suspended' ? 'destructive' : 'success'}>{user.status || 'active'}</Badge></CardTitle>
                            <CardDescription>{user.id}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 w-full mt-4">
                                <ProfileInfoItem icon={<Mail size={18} />} label="Email" value={user.email} />
                                <ProfileInfoItem icon={<Phone size={18} />} label="Mobile" value={user.mobile} />
                                <ProfileInfoItem icon={<User size={18} />} label="Category" value={user.category} />
                                <ProfileInfoItem icon={<MapPin size={18} />} label="State" value={user.state} />
                                <ProfileInfoItem icon={<BookCopy size={18} />} label="Class/Exam" value={user.class} />
                            </div>
                            <div className="flex gap-4 pt-4 border-t">
                                {user.status !== 'suspended' ? (
                                    <Button variant="destructive" onClick={() => handleStatusChange('suspended')}>
                                        <ShieldAlert className="mr-2 h-4 w-4" /> Suspend User
                                    </Button>
                                ) : (
                                    <Button variant="success" onClick={() => handleStatusChange('active')}>
                                        <ShieldCheck className="mr-2 h-4 w-4" /> Re-activate User
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <p>User not found.</p>
                )}
            </main>
        </div>
    );
}
