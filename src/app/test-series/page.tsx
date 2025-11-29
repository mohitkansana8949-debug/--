
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Loader, Timer, Newspaper } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRouter } from 'next/navigation';

type TestSeries = {
    id: string;
    name: string;
    description: string;
    isFree: boolean;
    price: number;
    duration: number;
    isEnrolled?: boolean;
};

export default function TestSeriesPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');
    const [tests, setTests] = useState<TestSeries[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const testsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        let q = query(collection(firestore, 'tests'), orderBy('createdAt', 'desc'));
        if (filter === 'free') {
            q = query(q, where('isFree', '==', true));
        } else if (filter === 'paid') {
            q = query(q, where('isFree', '==', false));
        }
        return q;
    }, [firestore, filter]);

    const { data: rawTests, isLoading: testsLoading } = useCollection(testsQuery);

     const checkEnrollments = useCallback(async () => {
        if (!rawTests || !user || !firestore) {
             if (rawTests) {
                setTests(rawTests.map(test => ({ ...test, isEnrolled: false })));
            }
            if(!testsLoading) setIsLoading(false);
            return;
        };

        setIsLoading(true);
        const testIds = rawTests.map(t => t.id);
        if (testIds.length === 0) {
            setTests([]);
            setIsLoading(false);
            return;
        }

        const enrollmentsRef = collection(firestore, 'enrollments');
        const enrollmentsQuery = query(enrollmentsRef, 
            where('userId', '==', user.uid), 
            where('itemType', '==', 'test'),
            where('itemId', 'in', testIds),
            where('status', '==', 'approved')
        );

        const querySnapshot = await getDocs(enrollmentsQuery);
        const enrolledIds = new Set(querySnapshot.docs.map(doc => doc.data().itemId));

        const updatedTests = rawTests.map(test => ({
            ...test,
            isEnrolled: enrolledIds.has(test.id),
        }));

        setTests(updatedTests);
        setIsLoading(false);
    }, [rawTests, user, firestore, testsLoading]);

    useEffect(() => {
        checkEnrollments();
    }, [checkEnrollments]);
    
    const handleActionClick = (path: string, openInNewTab: boolean) => {
        if (openInNewTab) {
            window.open(path, '_blank');
        } else {
            router.push(path);
        }
    }

    const renderTests = (items: TestSeries[] | null, loading: boolean) => {
        if (loading) {
            return <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>;
        }
        if (!items || items.length === 0) {
            return (
                 <div className="text-center text-muted-foreground mt-16">
                    <Newspaper className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4">इस श्रेणी में कोई टेस्ट उपलब्ध नहीं है।</p>
                </div>
            );
        }
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items?.map(test => (
                    <Card key={test.id} className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
                        <CardHeader>
                            <CardTitle>{test.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{test.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex justify-between items-end">
                            <div className='space-y-1'>
                                <p className="text-lg font-bold">{test.isFree ? 'फ्री' : `₹${test.price}`}</p>
                                <p className='text-sm text-muted-foreground flex items-center'><Timer className="mr-1 h-4 w-4"/>{test.duration} mins</p>
                            </div>
                           {test.isFree || test.isEnrolled ? (
                                <Button onClick={() => handleActionClick(`/test-series/${test.id}`, true)}>
                                    टेस्ट दें
                                </Button>
                            ) : (
                                <Button onClick={() => handleActionClick(`/payment?itemId=${test.id}&itemType=test`, false)}>
                                    अभी खरीदें
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
                <h1 className="text-3xl font-bold">टेस्ट सीरीज</h1>
                <p className="text-muted-foreground">
                    हमारी टेस्ट सीरीज के साथ अपनी तैयारी को परखें।
                </p>
            </div>
            
            <div className="flex justify-center mb-6">
                <ToggleGroup type="single" value={filter} onValueChange={(value) => { if (value) setFilter(value as any) }} defaultValue="all">
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                    <ToggleGroupItem value="paid">Paid</ToggleGroupItem>
                    <ToggleGroupItem value="free">Free</ToggleGroupItem>
                </ToggleGroup>
            </div>

            {renderTests(tests, isLoading)}
        </div>
    );
}
