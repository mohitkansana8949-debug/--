
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Loader, ShieldCheck, FileQuestion, Newspaper, Book as EbookIcon } from "lucide-react";
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type EnrolledItem = {
    id: string; // This is the item's ID (courseId, ebookId, etc.)
    name: string;
    description: string;
    thumbnailUrl: string;
    type: 'course' | 'ebook' | 'pyq' | 'test';
    url?: string; // For PDFs (ebook, pyq)
};

export default function MyLibraryPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [enrolledItems, setEnrolledItems] = useState<EnrolledItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'course' | 'ebook' | 'pyq' | 'test'>('all');

    const enrollmentsQuery = useMemoFirebase(
        () => (user && firestore ? query(
            collection(firestore, 'enrollments'),
            where('userId', '==', user.uid),
            where('status', '==', 'approved')
        ) : null),
        [user, firestore]
    );

    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

    const fetchItemDetails = useCallback(async () => {
        if (!enrollments || !firestore) {
            if (!enrollmentsLoading && !isUserLoading) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            if (enrollments.length > 0) {
                // Deduplicate enrollments by itemId to avoid fetching the same item multiple times
                const uniqueEnrollments = Array.from(new Map(enrollments.map(e => [e.itemId, e])).values());

                const itemIdsByType = uniqueEnrollments.reduce((acc, e) => {
                    if (!acc[e.itemType]) acc[e.itemType] = [];
                    acc[e.itemType].push(e.itemId);
                    return acc;
                }, {} as Record<string, string[]>);
                
                const fetchPromises = Object.entries(itemIdsByType).map(async ([type, ids]) => {
                    if (ids.length === 0) return [];
                    const collectionName = type + 's'; // courses, ebooks, tests, pyqs
                    const itemsRef = collection(firestore, collectionName);
                    // Firestore 'in' queries are limited to 30 items. If you have more, you need to batch.
                    const batches = [];
                    for (let i = 0; i < ids.length; i += 30) {
                        batches.push(ids.slice(i, i + 30));
                    }

                    const batchPromises = batches.map(batch => 
                        getDocs(query(itemsRef, where('__name__', 'in', batch)))
                    );

                    const allSnapshots = await Promise.all(batchPromises);
                    
                    const itemsData = allSnapshots.flatMap(snapshot => 
                        snapshot.docs.map(docSnap => ({
                            id: docSnap.id,
                            type,
                            ...docSnap.data()
                        }))
                    );
                    return itemsData;
                });

                const allItemsNested = await Promise.all(fetchPromises);
                const allItemsFlat = allItemsNested.flat();

                const itemsData = allItemsFlat.map(item => ({
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    thumbnailUrl: item.thumbnailUrl,
                    type: item.type as EnrolledItem['type'],
                    url: item.pdfUrl,
                }));
                
                setEnrolledItems(itemsData);
            } else {
                setEnrolledItems([]);
            }
        } catch (error) {
            console.error("Error fetching item details:", error);
            setEnrolledItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [enrollments, firestore, enrollmentsLoading, isUserLoading]);

    useEffect(() => {
        if (!enrollmentsLoading) {
            fetchItemDetails();
        }
    }, [enrollments, enrollmentsLoading, fetchItemDetails]);

    const finalLoading = isUserLoading || isLoading;
    
    const filteredItems = filter === 'all' 
        ? enrolledItems 
        : enrolledItems.filter(item => item.type === filter);


    const getItemLink = (item: EnrolledItem) => {
        switch(item.type) {
            case 'course':
                return `/courses/${item.id}/watch`;
            case 'ebook':
            case 'pyq':
                return `/pdf-viewer?url=${encodeURIComponent(item.url || '')}`;
            case 'test':
                 return `/take-test/${item.id}`;
            default:
                return '#';
        }
    }
    
    const getItemIcon = (type: EnrolledItem['type']) => {
        switch(type) {
            case 'course': return <BookOpen className="h-12 w-12 text-muted-foreground" />;
            case 'ebook': return <EbookIcon className="h-12 w-12 text-muted-foreground" />;
            case 'pyq': return <FileQuestion className="h-12 w-12 text-muted-foreground" />;
            case 'test': return <Newspaper className="h-12 w-12 text-muted-foreground" />;
            default: return <BookOpen className="h-12 w-12 text-muted-foreground" />;
        }
    }

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">मेरी लाइब्रेरी</h1>
                <p className="text-muted-foreground">
                    आपके द्वारा एनरोल किए गए सभी आइटम्स।
                </p>
            </div>
            
            <div className="flex justify-center mb-6">
                <ToggleGroup type="single" size="sm" value={filter} onValueChange={(value) => { if (value) setFilter(value as any) }} defaultValue="all">
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                    <ToggleGroupItem value="course">Courses</ToggleGroupItem>
                    <ToggleGroupItem value="ebook">E-books</ToggleGroupItem>
                    <ToggleGroupItem value="pyq">PYQs</ToggleGroupItem>
                    <ToggleGroupItem value="test">Tests</ToggleGroupItem>
                </ToggleGroup>
            </div>

            {finalLoading && (
                <div className="flex flex-col items-center justify-center text-center p-12">
                    <Loader className="h-12 w-12 animate-spin mb-4" />
                    <p>आपकी लाइब्रेरी लोड हो रही है...</p>
                </div>
            )}

            {!finalLoading && filteredItems.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <BookOpen className="h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold">
                            {filter === 'all' ? 'आपकी लाइब्रेरी खाली है' : `No ${filter}s found`}
                        </h3>
                        <p>
                            {filter === 'all' 
                                ? 'आपने अभी तक किसी भी आइटम में एनरोल नहीं किया है।' 
                                : `आपने अभी तक किसी ${filter} में एनरोल नहीं किया है।`
                            }
                        </p>
                        <Button asChild className="mt-4">
                            <Link href="/courses">कोर्सेस देखें</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!finalLoading && filteredItems.length > 0 && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <Card key={`${item.type}-${item.id}`} className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
                           {item.thumbnailUrl ? (
                             <Image 
                                src={item.thumbnailUrl} 
                                alt={item.name} 
                                width={300}
                                height={200}
                                className="rounded-t-lg object-cover w-full h-36"
                            />
                           ) : (
                            <div className="h-36 w-full bg-secondary flex items-center justify-center rounded-t-lg">
                                {getItemIcon(item.type)}
                            </div>
                           )}
                            <CardHeader className="p-3">
                                <CardTitle className="text-base line-clamp-2 h-12">{item.name}</CardTitle>
                                <CardDescription className="text-xs line-clamp-2 h-8">{item.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 flex-grow flex flex-col justify-end">
                                <Button asChild size="sm" className="w-full">
                                    <Link href={getItemLink(item)}>
                                        {item.type === 'course' ? 'पढ़ाई शुरू करें' : 'देखें'}
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
