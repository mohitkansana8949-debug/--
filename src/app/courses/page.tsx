
'use client';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import Image from 'next/image';
import { Loader } from 'lucide-react';

export default function CoursesPage() {
    const searchParams = useSearchParams();
    const filter = searchParams.get('filter');
    const firestore = useFirestore();

    const coursesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        const baseQuery = collection(firestore, 'courses');
        if (filter === 'free') return query(baseQuery, where('isFree', '==', true));
        if (filter === 'paid') return query(baseQuery, where('isFree', '==', false));
        return baseQuery;
    }, [firestore, filter]);

    const { data: courses, isLoading } = useCollection(coursesQuery);
    
    const title = filter === 'free' ? 'फ्री कोर्सेस' : filter === 'paid' ? 'पेड कोर्सेस' : 'सभी कोर्सेस';

    return (
        <div className="w-full">
             <div className="mb-8">
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-muted-foreground">
                    हमारे कोर्स कैटलॉग को ब्राउज़ करें।
                </p>
            </div>
             {isLoading && <div className="flex h-64 items-center justify-center"><Loader className="animate-spin" /></div>}

            {!isLoading && courses?.length === 0 && (
                <div className="text-center text-muted-foreground mt-16">
                    <p>इस श्रेणी में कोई कोर्स उपलब्ध नहीं है।</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses?.map(course => (
                    <Card key={course.id} className="overflow-hidden transition-shadow hover:shadow-lg flex flex-col">
                        {course.thumbnailUrl && (
                            <Image 
                                src={course.thumbnailUrl} 
                                alt={course.name} 
                                width={600}
                                height={400}
                                className="rounded-t-lg object-cover w-full h-48"
                            />
                        )}
                        <CardHeader>
                            <CardTitle>{course.name}</CardTitle>
                            <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex justify-between items-end">
                            <p className="text-lg font-bold">{course.isFree ? 'फ्री' : `₹${course.price}`}</p>
                            <Button asChild>
                                <Link href={`/courses/${course.id}`}>कोर्स देखें</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
