
'use client';

import { useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader, Bell, PlusCircle, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
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
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

export default function AdminNotificationsPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc'))
        : null,
    [firestore]
  );
  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'notifications', id));
      toast({
        title: 'Success',
        description: 'Notification has been deleted.',
      });
    } catch (error) {
      console.error('Error deleting notification: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete the notification.',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle>Sent Notifications</CardTitle>
          <CardDescription>
            View and manage all previously sent notifications.
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/create-notification">
            <PlusCircle className="mr-2" /> Send New
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader className="animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Body</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications?.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell className="font-medium">{notif.title}</TableCell>
                  <TableCell>{notif.body}</TableCell>
                  <TableCell>
                    {notif.createdAt
                      ? format(notif.createdAt.toDate(), 'dd MMM yyyy, HH:mm')
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete this notification record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(notif.id)}>
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && notifications?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground p-8"
                  >
                    <Bell className="mx-auto h-12 w-12" />
                    <p className="mt-4">No notifications have been sent yet.</p>
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
