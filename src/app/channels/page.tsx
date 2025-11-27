
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader, Youtube } from 'lucide-react';
import Image from 'next/image';

export default function ChannelsPage() {
    const firestore = useFirestore();

    const channelsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(
            collection(firestore, 'youtubeChannels'),
            orderBy('createdAt', 'desc')
        );
    }, [firestore]);

    const { data: channels, isLoading } = useCollection(channelsQuery);

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center">
                    <Youtube className="mr-3 h-8 w-8 text-red-500" />
                    यूट्यूब चैनल्स
                </h1>
                <p className="text-muted-foreground">
                    हमारे द्वारा क्यूरेट किए गए यूट्यूब चैनल्स।
                </p>
            </div>

            {isLoading && (
                <div className="flex h-64 items-center justify-center">
                    <Loader className="h-12 w-12 animate-spin" />
                </div>
            )}

            {!isLoading && channels?.length === 0 && (
                <div className="text-center text-muted-foreground mt-16 p-8 border rounded-lg">
                    <p className="text-lg">अभी कोई चैनल नहीं जोड़ा गया है।</p>
                    <p>कृपया बाद में दोबारा देखें।</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {channels?.map(channel => (
                    <Link href={channel.channelUrl} key={channel.id} target="_blank" rel="noopener noreferrer">
                        <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                            <div className="aspect-video relative w-full">
                                <Image 
                                    src={channel.coverImageUrl} 
                                    alt="Channel cover" 
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-t-lg"
                                />
                            </div>
                            <CardHeader>
                                <CardTitle className="text-lg truncate">{channel.channelUrl}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
