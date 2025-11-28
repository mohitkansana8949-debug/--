
'use client';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Loader, Timer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TestSeriesPage() {
    const searchParams = useSearchParams();
    const filter = searchParams.get('filter');
    const firestore = useFirestore();

    const getQuery = (isFree: boolean) => {
        if (!firestore) return null;
        return query(collection(firestore, 'tests'), where('isFree', '==', isFree));
    }

    const freeTestsQuery = useMemoFirebase(() => getQuery(true), [firestore]);
    const paidTestsQuery = useMemoFirebase(() => getQuery(false), [firestore]);

    const { data: freeTests, isLoading: freeLoading } = useCollection(freeTestsQuery);
    const { data: paidTests, isLoading: paidLoading } = useCollection(paidTestsQuery);
    
    const renderTests = (tests: any[] | null, isLoading: boolean) => {
        if (isLoading) {
            return <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>;
        }
        if (tests?.length === 0) {
            return <div className="text-center text-muted-foreground mt-16"><p>इस श्रेणी में कोई टेस्ट उपलब्ध नहीं है।</p></div>;
        }
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tests?.map(test => (
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
             <div className="mb-8">
                <h1 className="text-3xl font-bold">टेस्ट सीरीज</h1>
                <p className="text-muted-foreground">
                    हमारी टेस्ट सीरीज के साथ अपनी तैयारी को परखें।
                </p>
            </div>
            
            <Tabs defaultValue="free" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="free">फ्री टेस्ट</TabsTrigger>
                    <TabsTrigger value="paid">पेड टेस्ट</TabsTrigger>
                </TabsList>
                <TabsContent value="free">
                    {renderTests(freeTests, freeLoading)}
                </TabsContent>
                <TabsContent value="paid">
                    {renderTests(paidTests, paidLoading)}
                </TabsContent>
            </Tabs>
        </div>
    );
}
