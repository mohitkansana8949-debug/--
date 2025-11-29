
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import Image from 'next/image';
import { Loader, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function EbooksPage() {
    const firestore = useFirestore();
    const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');

    const ebooksQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const baseQuery = query(collection(firestore, 'ebooks'), orderBy('createdAt', 'desc'));
        if (filter === 'free') return query(collection(firestore, 'ebooks'), where('isFree', '==', true), orderBy('createdAt', 'desc'));
        if (filter === 'paid') return query(collection(firestore, 'ebooks'), where('isFree', '==', false), orderBy('createdAt', 'desc'));
        return baseQuery;
    }, [firestore, filter]);

    const { data: ebooks, isLoading } = useCollection(ebooksQuery);

    const renderEbooks = (items: any[] | null, loading: boolean) => {
        if (loading) {
            return <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>;
        }
        if (!items || items.length === 0) {
            return (
                <div className="text-center text-muted-foreground mt-16">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4">इस श्रेणी में कोई ई-बुक उपलब्ध नहीं है।</p>
                </div>
            );
        }
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map(ebook => (
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
             <div className="mb-6">
                <h1 className="text-3xl font-bold">ई-बुक्स</h1>
                <p className="text-muted-foreground">
                    हमारी ई-बुक्स के संग्रह को ब्राउज़ करें।
                </p>
            </div>
            
            <div className="flex justify-center mb-6">
                 <ToggleGroup type="single" value={filter} onValueChange={(value) => { if (value) setFilter(value as any) }} defaultValue="all">
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                    <ToggleGroupItem value="paid">Paid</ToggleGroupItem>
                    <ToggleGroupItem value="free">Free</ToggleGroupItem>
                </ToggleGroup>
            </div>

            {renderEbooks(ebooks, isLoading)}
        </div>
    );
}
