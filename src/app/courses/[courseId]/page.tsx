
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader } from 'lucide-react';

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const firestore = useFirestore();
    const router = useRouter();

    const courseRef = useMemoFirebase(
        () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
        [firestore, courseId]
    );

    const { data: course, isLoading } = useDoc(courseRef);

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader className="animate-spin" /></div>;
    }

    if (!course) {
        return <div className="text-center">कोर्स नहीं मिला।</div>;
    }
    
    const handleBuyNow = () => {
        router.push(`/courses/${courseId}/payment`);
    }

    return (
        <div className="container mx-auto p-4">
            <Card>
                {course.thumbnailUrl && (
                    <div className="w-full aspect-video relative">
                        <Image 
                            src={course.thumbnailUrl}
                            alt={course.name}
                            fill
                            className="rounded-t-lg object-cover"
                        />
                    </div>
                )}
                <CardHeader>
                    <CardTitle className="text-3xl">{course.name}</CardTitle>
                    <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div dangerouslySetInnerHTML={{ __html: course.content || ''}} />
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                     <p className="text-2xl font-bold">{course.isFree ? 'फ्री' : `₹${course.price}`}</p>
                     {!course.isFree && (
                        <Button onClick={handleBuyNow} size="lg">अभी खरीदें</Button>
                     )}
                </CardFooter>
            </Card>
        </div>
    );
}


    

    