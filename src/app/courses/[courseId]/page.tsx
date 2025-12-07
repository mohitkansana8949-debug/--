
'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader, ShieldCheck, PlayCircle, Youtube, FileText, Newspaper, ClipboardCheck, Book, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const firestore = useFirestore();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const { toast } = useToast();
    
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);

    const courseRef = useMemoFirebase(
        () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
        [firestore, courseId]
    );

    const enrollmentsQuery = useMemoFirebase(
        () => (user && firestore && courseId ? query(
            collection(firestore, 'enrollments'),
            where('userId', '==', user.uid),
            where('itemId', '==', courseId),
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
    
    const handleEnrollForFree = async () => {
        if (!user || !firestore || !course || !course.isFree) return;
        setIsEnrolling(true);
        try {
            const enrollmentRef = doc(collection(firestore, 'enrollments'));
            await setDoc(enrollmentRef, {
                userId: user.uid,
                itemId: course.id,
                itemType: 'course',
                itemName: course.name,
                enrollmentDate: serverTimestamp(),
                paymentMethod: 'free',
                paymentTransactionId: 'N/A',
                status: 'approved',
            });
            toast({ title: 'Success!', description: 'You have been enrolled in this course.'});
            setIsEnrolled(true); // Manually update state to reflect enrollment
        } catch (error) {
            console.error('Free enrollment error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not enroll in the course.' });
        } finally {
            setIsEnrolling(false);
        }
    }

    const isLoading = isCourseLoading || isUserLoading || areEnrollmentsLoading;

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader className="animate-spin" /></div>;
    }

    if (!course) {
        return <div className="text-center">कोर्स नहीं मिला।</div>;
    }
    
    const handleBuyNow = () => {
        router.push(`/payment?itemId=${courseId}&itemType=course`);
    }
    
    const getIcon = (type: string) => {
        switch(type) {
            case 'youtube': return <Youtube className="h-5 w-5 shrink-0 text-red-500" />;
            case 'pdf': return <FileText className="h-5 w-5 shrink-0" />;
            case 'pyq': return <Newspaper className="h-5 w-5 shrink-0" />;
            case 'test': return <ClipboardCheck className="h-5 w-5 shrink-0 text-blue-500" />;
            default: return <Book className="h-5 w-5 shrink-0" />;
        }
    };


    return (
        <div className="container mx-auto p-4 space-y-8">
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
                     ) : course.isFree ? (
                         <Button onClick={handleEnrollForFree} size="lg" disabled={isEnrolling}>
                             {isEnrolling ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                             Enroll for Free
                         </Button>
                     ) : (
                        <Button onClick={handleBuyNow} size="lg">अभी खरीदें</Button>
                     )}
                </CardFooter>
            </Card>

            {course.demoContent?.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><PlayCircle className="h-6 w-6 text-primary"/>Course Demo</CardTitle>
                        <CardDescription>Get a preview of what's inside the course.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3 text-blue-800 dark:text-blue-200">
                             <Info className="h-5 w-5 shrink-0" />
                             <p className="text-sm font-medium">This is a demo. Purchase the course to get access to all content.</p>
                         </div>
                         <Separator />
                        {course.demoContent.map((item: any) => (
                             <a href={item.url} target="_blank" rel="noopener noreferrer" className="block" key={item.id}>
                                 <Card className="cursor-pointer hover:bg-muted/50">
                                     <CardContent className="p-3">
                                         <div className="flex gap-3 items-center">
                                             {getIcon(item.type)}
                                             <p className="font-semibold text-sm line-clamp-2">{item.title}</p>
                                         </div>
                                     </CardContent>
                                 </Card>
                            </a>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
