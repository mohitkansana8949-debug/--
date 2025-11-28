
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const firestore = useFirestore();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    
    const [isEnrolled, setIsEnrolled] = useState(false);

    const courseRef = useMemoFirebase(
        () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
        [firestore, courseId]
    );

    const enrollmentsQuery = useMemoFirebase(
        () => (user && firestore && courseId ? query(
            collection(firestore, 'courseEnrollments'),
            where('userId', '==', user.uid),
            where('courseId', '==', courseId),
            where('status', '==', 'approved')
        ) : null),
        [user, firestore, courseId]
    );

    const { data: course, isLoading: isCourseLoading } = useDoc(courseRef);
    const { data: enrollments, isLoading: areEnrollmentsLoading } = useCollection(enrollmentsQuery);

    useEffect(() => {
        if (enrollments && enrollments.length > 0) {
            setIsEnrolled(true);
        } else {
            setIsEnrolled(false);
        }
    }, [enrollments]);
    
    const isLoading = isCourseLoading || isUserLoading || areEnrollmentsLoading;

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
                    <p className="font-bold text-lg mb-2">इस कोर्स में क्या है?</p>
                    <div className="prose dark:prose-invert max-w-none">
                        {course.content?.length > 0 ? (
                            <ul className="list-disc pl-5 space-y-1">
                                {course.content.map((item: any) => (
                                    <li key={item.id}>{item.title}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">कंटेंट जल्द ही जोड़ा जाएगा।</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                     <p className="text-2xl font-bold">{course.isFree ? 'फ्री' : `₹${course.price}`}</p>
                     {isEnrolled ? (
                         <Button asChild size="lg">
                            <Link href={`/courses/${courseId}/watch`}>
                                <ShieldCheck className="mr-2 h-5 w-5" />
                                पढ़ाई शुरू करें
                            </Link>
                         </Button>
                     ) : (
                        !course.isFree && <Button onClick={handleBuyNow} size="lg">अभी खरीदें</Button>
                     )}
                </CardFooter>
            </Card>
        </div>
    );
}
