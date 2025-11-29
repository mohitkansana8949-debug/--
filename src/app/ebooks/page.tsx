
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import { Loader, BookOpen } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Ebook = {
    id: string;
    name: string;
    description: string;
    thumbnailUrl?: string;
    isFree: boolean;
    price: number;
    pdfUrl: string;
    isEnrolled?: boolean;
};

export default function EbooksPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
    const [ebooks, setEbooks] = useState<Ebook[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const ebooksQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collection(firestore, 'ebooks'), orderBy('createdAt', 'desc'));
        if (filter === 'free') {
            q = query(q, where('isFree', '==', true));
        } else if (filter === 'paid') {
            q = query(q, where('isFree', '==', false));
        }
        return q;
    }, [firestore, filter]);

    const { data: rawEbooks, isLoading: ebooksLoading } = useCollection(ebooksQuery);

    const checkEnrollments = useCallback(async () => {
        if (!rawEbooks || !user || !firestore) {
             if (rawEbooks) {
                setEbooks(rawEbooks.map(ebook => ({ ...ebook, isEnrolled: false })));
            }
            if(!ebooksLoading) setIsLoading(false);
            return;
        };

        setIsLoading(true);
        const ebookIds = rawEbooks.map(e => e.id);
        if (ebookIds.length === 0) {
            setEbooks([]);
            setIsLoading(false);
            return;
        }

        const enrollmentsRef = collection(firestore, 'enrollments');
        const enrollmentsQuery = query(enrollmentsRef, 
            where('userId', '==', user.uid), 
            where('itemType', '==', 'ebook'),
            where('itemId', 'in', ebookIds),
            where('status', '==', 'approved')
        );

        const querySnapshot = await getDocs(enrollmentsQuery);
        const enrolledIds = new Set(querySnapshot.docs.map(doc => doc.data().itemId));

        const updatedEbooks = rawEbooks.map(ebook => ({
            ...ebook,
            isEnrolled: enrolledIds.has(ebook.id),
        }));

        setEbooks(updatedEbooks);
        setIsLoading(false);
    }, [rawEbooks, user, firestore, ebooksLoading]);

    useEffect(() => {
        checkEnrollments();
    }, [checkEnrollments]);

    const renderEbooks = (items: Ebook[] | null, loading: boolean) => {
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
                            {ebook.isFree || ebook.isEnrolled ? (
                                <Button asChild>
                                    <Link href={`/pdf-viewer?url=${encodeURIComponent(ebook.pdfUrl)}`}>पढ़ें</Link>
                                </Button>
                            ) : (
                                <Button asChild>
                                    <Link href={`/payment?itemId=${ebook.id}&itemType=ebook`}>अभी खरीदें</Link>
                                </Button>
                            )}
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
