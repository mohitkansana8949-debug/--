
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Loader, FileQuestion } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type PYQ = {
    id: string;
    name: string;
    description: string;
    thumbnailUrl?: string;
    isFree: boolean;
    price: number;
    pdfUrl: string;
    isEnrolled?: boolean;
};

export default function PYQsPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
    const [pyqs, setPyqs] = useState<PYQ[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const pyqsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collection(firestore, 'pyqs'), orderBy('createdAt', 'desc'));
        if (filter === 'free') {
            q = query(q, where('isFree', '==', true));
        } else if (filter === 'paid') {
            q = query(q, where('isFree', '==', false));
        }
        return q;
    }, [firestore, filter]);

    const { data: rawPyqs, isLoading: pyqsLoading } = useCollection(pyqsQuery);

    const checkEnrollments = useCallback(async () => {
        if (!rawPyqs || !user || !firestore) {
             if (rawPyqs) {
                setPyqs(rawPyqs.map(pyq => ({ ...pyq, isEnrolled: false })));
            }
            if (!pyqsLoading) setIsLoading(false);
            return;
        };

        setIsLoading(true);
        const pyqIds = rawPyqs.map(p => p.id);
        if (pyqIds.length === 0) {
            setPyqs([]);
            setIsLoading(false);
            return;
        }

        const enrollmentsRef = collection(firestore, 'enrollments');
        const enrollmentsQuery = query(enrollmentsRef, 
            where('userId', '==', user.uid), 
            where('itemType', '==', 'pyq'),
            where('itemId', 'in', pyqIds),
            where('status', '==', 'approved')
        );

        const querySnapshot = await getDocs(enrollmentsQuery);
        const enrolledIds = new Set(querySnapshot.docs.map(doc => doc.data().itemId));

        const updatedPyqs = rawPyqs.map(pyq => ({
            ...pyq,
            isEnrolled: enrolledIds.has(pyq.id),
        }));

        setPyqs(updatedPyqs);
        setIsLoading(false);
    }, [rawPyqs, user, firestore, pyqsLoading]);

    useEffect(() => {
        checkEnrollments();
    }, [checkEnrollments]);

    const renderItems = (items: PYQ[] | null, loading: boolean) => {
        if (loading) {
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
                            {item.isFree || item.isEnrolled ? (
                                <Button asChild>
                                    <Link href={`/pdf-viewer?url=${encodeURIComponent(item.pdfUrl)}`}>देखें</Link>
                                </Button>
                            ) : (
                                <Button asChild>
                                    <Link href={`/payment?itemId=${item.id}&itemType=pyq`}>अभी खरीदें</Link>
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
                <h1 className="text-3xl font-bold">Previous Year Questions (PYQs)</h1>
                <p className="text-muted-foreground">
                    पिछले वर्षों के प्रश्न पत्रों के साथ अभ्यास करें।
                </p>
            </div>
            
            <div className="flex justify-center mb-6">
                <ToggleGroup type="single" value={filter} onValueChange={(value) => { if (value) setFilter(value as any) }} defaultValue="all">
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                    <ToggleGroupItem value="paid">Paid</ToggleGroupItem>
                    <ToggleGroupItem value="free">Free</ToggleGroupItem>
                </ToggleGroup>
            </div>
            
            {renderItems(pyqs, isLoading)}
        </div>
    );
}
