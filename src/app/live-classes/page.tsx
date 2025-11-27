
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader, Youtube, UserCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function LiveClassesPage() {
    const firestore = useFirestore();

    const liveClassesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'liveClasses'),
            where('startTime', '>=', Timestamp.now()),
            orderBy('startTime', 'asc')
        );
    }, [firestore]);

    const { data: liveClasses, isLoading } = useCollection(liveClassesQuery);

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center">
                    <Youtube className="mr-3 h-8 w-8 text-red-500" />
                    आने वाली लाइव क्लासेस
                </h1>
                <p className="text-muted-foreground">
                    हमारी आने वाली सभी लाइव क्लासेस की लिस्ट।
                </p>
            </div>

            {isLoading && (
                <div className="flex h-64 items-center justify-center">
                    <Loader className="h-12 w-12 animate-spin" />
                </div>
            )}

            {!isLoading && liveClasses?.length === 0 && (
                <div className="text-center text-muted-foreground mt-16 p-8 border rounded-lg">
                    <p className="text-lg">अभी कोई लाइव क्लास शेड्यूल नहीं है।</p>
                    <p>कृपया बाद में दोबारा देखें।</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveClasses?.map(liveClass => (
                    <Card key={liveClass.id} className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
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
                           <p className="text-muted-foreground">विषय: {liveClass.youtubeVideoId}</p>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link href={`/live-classes/${liveClass.id}`}>क्लास ज्वाइन करें</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
