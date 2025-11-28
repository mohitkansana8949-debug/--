
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader, Video, UserCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function RecordedClassesPage() {
    const firestore = useFirestore();

    // Query for recorded (past) live classes
    const recordedClassesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'liveClasses'),
            where('startTime', '<', Timestamp.now()),
            orderBy('startTime', 'desc')
        );
    }, [firestore]);

    const { data: recordedClasses, isLoading: recordedLoading } = useCollection(recordedClassesQuery);

    return (
        <div className="container mx-auto p-4 space-y-12">
            <div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center">
                        <Video className="mr-3 h-8 w-8 text-primary" />
                        रिकॉर्डेड क्लास
                    </h1>
                    <p className="text-muted-foreground">
                        जो लाइव क्लास हो चुकी हैं, उन्हें यहाँ देखें।
                    </p>
                </div>

                {recordedLoading && (
                    <div className="flex h-48 items-center justify-center">
                        <Loader className="h-12 w-12 animate-spin" />
                    </div>
                )}

                {!recordedLoading && recordedClasses?.length === 0 && (
                    <div className="text-center text-muted-foreground mt-16 p-8 border rounded-lg">
                        <p className="text-lg">अभी कोई रिकॉर्डेड क्लास उपलब्ध नहीं है।</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recordedClasses?.map(liveClass => (
                        <ClassCard key={liveClass.id} liveClass={liveClass} />
                    ))}
                </div>
            </div>
        </div>
    );
}


function ClassCard({ liveClass }: { liveClass: any }) {
     return (
        <Card className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-primary" /> 
                    {liveClass.teacherName}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 pt-2">
                    <Calendar className="h-4 w-4" />
                    {liveClass.startTime ? format(liveClass.startTime.toDate(), 'PPP p') : 'समय तय नहीं है'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-2">विषय: {liveClass.youtubeVideoId}</p>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={`/live-classes/${liveClass.id}`}>
                        वीडियो देखें
                    </Link>
                </Button>
            </CardFooter>
        </Card>
     )
}
