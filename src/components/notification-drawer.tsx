
'use client';

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Bell, Loader, AlertTriangle } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { hi } from 'date-fns/locale';
import Image from "next/image";

export function NotificationDrawer() {
    const firestore = useFirestore();

    const notificationsQuery = useMemoFirebase(() => (
        firestore ? query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc')) : null
    ), [firestore]);

    const { data: notifications, isLoading, error } = useCollection(notificationsQuery);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Notifications</SheetTitle>
                    <SheetDescription>
                        Recent announcements and updates.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                    {isLoading && (
                        <div className="flex justify-center items-center p-8">
                            <Loader className="animate-spin" />
                        </div>
                    )}
                    {error && (
                         <div className="text-center text-destructive text-sm p-4">
                            <AlertTriangle className="mx-auto mb-2 h-6 w-6"/>
                            Could not load notifications.
                        </div>
                    )}
                    {!isLoading && notifications && notifications.length > 0 ? (
                        notifications.map(notif => (
                            <div key={notif.id} className="flex gap-3 border-b pb-3">
                                {notif.imageUrl && (
                                    <Image src={notif.imageUrl} alt={notif.title} width={64} height={64} className="rounded-md object-cover" />
                                )}
                                <div className="flex-1">
                                    <p className="font-semibold">{notif.title}</p>
                                    <p className="text-sm text-muted-foreground">{notif.body}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: hi }) : '...'}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                       !isLoading && <p className="text-center text-muted-foreground p-8">No notifications yet.</p>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
