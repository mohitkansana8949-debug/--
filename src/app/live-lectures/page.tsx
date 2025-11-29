
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { Loader, Clapperboard, Badge } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { hi } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

export default function LiveLecturesPage() {
    const firestore = useFirestore();
    const router = useRouter();

    const lecturesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'liveLectures'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: lectures, isLoading } = useCollection(lecturesQuery);
    
    const handleLectureClick = (lecture: any) => {
        router.push(`/live-lectures/${lecture.videoId}?chatId=${lecture.id}`);
    }

    return (
        <div className="w-full">
             <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Clapperboard className="h-8 w-8" />
                    Live Classes
                </h1>
                <p className="text-muted-foreground">
                    Join live classes or watch recent recordings.
                </p>
            </div>
             {isLoading && <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>}

            {!isLoading && lectures?.length === 0 && (
                <div className="text-center text-muted-foreground mt-16">
                    <p>No live classes are scheduled right now. Please check back later.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {lectures?.map(lecture => (
                    <Card key={lecture.id} onClick={() => handleLectureClick(lecture)} className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg flex flex-col h-full group">
                        <div className="relative w-full aspect-video">
                            <Image 
                                src={lecture.thumbnailUrl} 
                                alt={lecture.title} 
                                fill
                                className="object-cover"
                            />
                            {lecture.isLive && (
                               <div className="absolute top-2 left-2 flex items-center text-xs text-white font-bold bg-red-600 px-2 py-1 rounded-md">
                                    <span className="relative flex h-2 w-2 mr-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                    LIVE
                               </div>
                            )}
                        </div>
                        <CardHeader>
                            <CardTitle className="text-base line-clamp-2 h-12 group-hover:text-primary">{lecture.title}</CardTitle>
                            {lecture.createdAt && (
                                <CardDescription className="text-xs">
                                    {formatDistanceToNow(lecture.createdAt.toDate(), { addSuffix: true, locale: hi })}
                                </CardDescription>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
}
