
'use client';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminCoursesPage() {
    const { firestore } = useFirebase();
    const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
    const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
    return (
        <Card>
            <CardHeader><CardTitle>सभी कोर्सेस</CardTitle></CardHeader>
            <CardContent>
                {coursesLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {courses?.map(course => (
                            <Card key={course.id}>
                                {course.thumbnailUrl && <Image src={course.thumbnailUrl} alt={course.name} width={400} height={200} className="rounded-t-lg object-cover w-full h-32"/>}
                                <CardHeader><CardTitle className="text-lg line-clamp-1">{course.name}</CardTitle></CardHeader>
                                <CardContent><Button asChild className="w-full"><Link href={`/courses/${course.id}`}>देखें</Link></Button></CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
