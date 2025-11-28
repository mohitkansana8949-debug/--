
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader, FileQuestion } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from 'next/image';

export default function PYQsPage() {
    const firestore = useFirestore();

    const getQuery = (isFree: boolean) => {
        if (!firestore) return null;
        return query(collection(firestore, 'pyqs'), where('isFree', '==', isFree));
    }

    const freeQuery = useMemoFirebase(() => getQuery(true), [firestore]);
    const paidQuery = useMemoFirebase(() => getQuery(false), [firestore]);

    const { data: freeItems, isLoading: freeLoading } = useCollection(freeQuery);
    const { data: paidItems, isLoading: paidLoading } = useCollection(paidQuery);

    const renderItems = (items: any[] | null, isLoading: boolean) => {
        if (isLoading) {
            return <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>;
        }
        if (!items || items.length === 0) {
            return (
                <div className="text-center text-muted-foreground mt-16">
                    <FileQuestion className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4">इस श्रेणी में कोई PYQ उपलब्ध नहीं है।</p>
                </div>
            );
        }
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map(item => (
                    <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
                        {item.thumbnailUrl ? (
                            <Image 
                                src={item.thumbnailUrl} 
                                alt={item.name} 
                                width={600}
                                height={400}
                                className="rounded-t-lg object-cover w-full h-48"
                            />
                        ) : (
                            <div className="h-48 w-full bg-secondary flex items-center justify-center rounded-t-lg">
                                <FileQuestion className="h-16 w-16 text-muted-foreground"/>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle>{item.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex justify-between items-end">
                            <p className="text-lg font-bold">{item.isFree ? 'फ्री' : `₹${item.price}`}</p>
                            <Button asChild>
                                <Link href={`/pdf-viewer?url=${encodeURIComponent(item.pdfUrl)}`} target="_blank">देखें</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="w-full">
             <div className="mb-8">
                <h1 className="text-3xl font-bold">Previous Year Questions (PYQs)</h1>
                <p className="text-muted-foreground">
                    पिछले वर्षों के प्रश्न पत्रों के साथ अभ्यास करें।
                </p>
            </div>
            
            <Tabs defaultValue="free" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="free">फ्री PYQs</TabsTrigger>
                    <TabsTrigger value="paid">पेड PYQs</TabsTrigger>
                </TabsList>
                <TabsContent value="free">
                    {renderItems(freeItems, freeLoading)}
                </TabsContent>
                <TabsContent value="paid">
                    {renderItems(paidItems, paidLoading)}
                </TabsContent>
            </Tabs>
        </div>
    );
}
