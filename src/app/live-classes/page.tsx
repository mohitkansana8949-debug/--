'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader, Youtube, UserCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export default function LiveClassesPage() {
    const firestore = useFirestore();

    // Query for upcoming live classes (startTime is in the future)
    const upcomingClassesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'liveClasses'),
            where('startTime', '>=', Timestamp.now()),
            orderBy('startTime', 'asc')
        );
    }, [firestore]);

    const { data: upcomingClasses, isLoading: upcomingLoading } = useCollection(upcomingClassesQuery);

    return (
        <div className="container mx-auto p-4 space-y-12">
            <div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold flex items-center">
                        <Youtube className="mr-3 h-8 w-8 text-red-500" />
                        आने वाली लाइव क्लासेस
                    </h1>
                    <p className="text-muted-foreground">
                        हमारी आने वाली सभी लाइव क्लासेस की लिस्ट।
                    </p>
                </div>

                {upcomingLoading && (
                    <div className="flex h-48 items-center justify-center">
                        <Loader className="h-12 w-12 animate-spin" />
                    </div>
                )}

                {!upcomingLoading && upcomingClasses?.length === 0 && (
                    <div className="text-center text-muted-foreground mt-16 p-8 border rounded-lg">
                        <p className="text-lg">अभी कोई लाइव क्लास शेड्यूल नहीं है।</p>
                        <p>कृपया बाद में दोबारा देखें।</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingClasses?.map(liveClass => (
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
            {liveClass.thumbnailUrl && <Image src={liveClass.thumbnailUrl} alt={liveClass.title} width={400} height={225} className="w-full h-auto aspect-video object-cover" />}
            <CardHeader>
                <CardTitle className="line-clamp-2">{liveClass.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 pt-2">
                    <UserCircle className="h-4 w-4" /> 
                    {liveClass.teacherName}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                 <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {liveClass.startTime ? format(liveClass.startTime.toDate(), 'PPP p') : 'समय तय नहीं है'}
                </p>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href={`/live-classes/${liveClass.id}`}>
                        क्लास ज्वाइन करें
                    </Link>
                </Button>
            </CardFooter>
        </Card>
     )
}
