
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { Loader, BookOpen } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EbooksPage() {
    const firestore = useFirestore();

    const getQuery = (isFree: boolean) => {
        if (!firestore) return null;
        return query(collection(firestore, 'ebooks'), where('isFree', '==', isFree));
    }

    const freeEbooksQuery = useMemoFirebase(() => getQuery(true), [firestore]);
    const paidEbooksQuery = useMemoFirebase(() => getQuery(false), [firestore]);

    const { data: freeEbooks, isLoading: freeLoading } = useCollection(freeEbooksQuery);
    const { data: paidEbooks, isLoading: paidLoading } = useCollection(paidEbooksQuery);

    const renderEbooks = (ebooks: any[] | null, isLoading: boolean) => {
        if (isLoading) {
            return <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>;
        }
        if (!ebooks || ebooks.length === 0) {
            return (
                <div className="text-center text-muted-foreground mt-16">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4">इस श्रेणी में कोई ई-बुक उपलब्ध नहीं है।</p>
                </div>
            );
        }
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {ebooks.map(ebook => (
                    <Card key={ebook.id} className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
                        {ebook.thumbnailUrl ? (
                            <Image 
                                src={ebook.thumbnailUrl} 
                                alt={ebook.name} 
                                width={600}
                                height={400}
                                className="rounded-t-lg object-cover w-full h-48"
                            />
                        ) : (
                            <div className="h-48 w-full bg-secondary flex items-center justify-center rounded-t-lg">
                                <BookOpen className="h-16 w-16 text-muted-foreground"/>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle>{ebook.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{ebook.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex justify-between items-end">
                            <p className="text-lg font-bold">{ebook.isFree ? 'फ्री' : `₹${ebook.price}`}</p>
                            <Button asChild>
                                <Link href={`/pdf-viewer?url=${encodeURIComponent(ebook.pdfUrl)}`} target="_blank">पढ़ें</Link>
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
                <h1 className="text-3xl font-bold">ई-बुक्स</h1>
                <p className="text-muted-foreground">
                    हमारी ई-बुक्स के संग्रह को ब्राउज़ करें।
                </p>
            </div>
            
            <Tabs defaultValue="free" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="free">फ्री ई-बुक्स</TabsTrigger>
                    <TabsTrigger value="paid">पेड ई-बुक्स</TabsTrigger>
                </TabsList>
                <TabsContent value="free">
                    {renderEbooks(freeEbooks, freeLoading)}
                </TabsContent>
                <TabsContent value="paid">
                    {renderEbooks(paidEbooks, paidLoading)}
                </TabsContent>
            </Tabs>
        </div>
    );
}
