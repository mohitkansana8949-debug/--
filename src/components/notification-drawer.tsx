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
import { useState, useEffect } from 'react';

export function NotificationDrawer() {
    const firestore = useFirestore();
    const [hasNew, setHasNew] = useState(false);
    const [lastOpened, setLastOpened] = useState<Date | null>(null);

    const notificationsQuery = useMemoFirebase(() => (
        firestore ? query(collection(firestore, 'notifications'), orderBy('createdAt', 'desc')) : null
    ), [firestore]);

    const { data: notifications, isLoading, error } = useCollection(notificationsQuery);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
             const storedTime = localStorage.getItem('lastNotificationCheck');
             setLastOpened(storedTime ? new Date(storedTime) : null);
        }
    }, []);

    useEffect(() => {
        if (notifications && notifications.length > 0 && lastOpened) {
            const latestNotifTime = notifications[0].createdAt?.toDate();
            if (latestNotifTime && latestNotifTime > lastOpened) {
                setHasNew(true);
            } else {
                setHasNew(false);
            }
        } else if (notifications && notifications.length > 0 && !lastOpened) {
            setHasNew(true);
        }
    }, [notifications, lastOpened]);

    const handleOpenChange = (open: boolean) => {
        if (open) {
            const now = new Date();
            localStorage.setItem('lastNotificationCheck', now.toISOString());
            setLastOpened(now);
            setHasNew(false);
        }
    }


    return (
        <Sheet onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasNew && <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500" />}
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
