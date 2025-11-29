
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Loader, Timer } from 'lucide-react';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function TestSeriesPage() {
    const firestore = useFirestore();
    const [filter, setFilter] = useState<'all' | 'free' | 'paid'>('all');

    const testsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const baseQuery = query(collection(firestore, 'tests'), orderBy('createdAt', 'desc'));
        if (filter === 'free') return query(collection(firestore, 'tests'), where('isFree', '==', true), orderBy('createdAt', 'desc'));
        if (filter === 'paid') return query(collection(firestore, 'tests'), where('isFree', '==', false), orderBy('createdAt', 'desc'));
        return baseQuery;
    }, [firestore, filter]);

    const { data: tests, isLoading } = useCollection(testsQuery);
    
    const renderTests = (items: any[] | null, loading: boolean) => {
        if (loading) {
            return <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>;
        }
        if (!items || items.length === 0) {
            return <div className="text-center text-muted-foreground mt-16"><p>इस श्रेणी में कोई टेस्ट उपलब्ध नहीं है।</p></div>;
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
                            <Button asChild>
                                <Link href={`/test-series/${test.id}`}>टेस्ट दें</Link>
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
