
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Loader, ShieldCheck, AlertCircle } from "lucide-react";
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type EnrolledCourse = {
    id: string;
    name: string;
    description: string;
    thumbnailUrl: string;
};

export default function MyLibraryPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const enrollmentsQuery = useMemoFirebase(
        () => (user && firestore ? query(
            collection(firestore, 'courseEnrollments'),
            where('userId', '==', user.uid),
            where('status', '==', 'approved')
        ) : null),
        [user, firestore]
    );

    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

    const fetchCourseDetails = useCallback(async () => {
        if (!enrollments || !firestore) {
            if (!enrollmentsLoading && !isUserLoading) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            if (enrollments.length > 0) {
                const courseIds = enrollments.map(e => e.courseId);
                const coursesRef = collection(firestore, 'courses');
                const coursesQuery = query(coursesRef, where('__name__', 'in', courseIds));
                const courseSnapshots = await getDocs(coursesQuery);
                
                const coursesData = courseSnapshots.docs.map(docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                } as EnrolledCourse));
                
                setEnrolledCourses(coursesData);
            } else {
                setEnrolledCourses([]);
            }
        } catch (error) {
            console.error("Error fetching course details:", error);
            setEnrolledCourses([]);
        } finally {
            setIsLoading(false);
        }
    }, [enrollments, firestore, enrollmentsLoading, isUserLoading]);

    useEffect(() => {
        if (!enrollmentsLoading) {
            fetchCourseDetails();
        }
    }, [enrollments, enrollmentsLoading, fetchCourseDetails]);

    const finalLoading = isUserLoading || isLoading;

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">मेरी लाइब्रेरी</h1>
                <p className="text-muted-foreground">
                    आपके द्वारा एनरोल किए गए कोर्सेस।
                </p>
            </div>
            
             <Card className="mb-6 bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                <CardHeader className="flex flex-row items-center gap-4">
                    <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    <CardTitle className="text-yellow-800 dark:text-yellow-200 text-lg">महत्वपूर्ण सूचना</CardTitle>
                </CardHeader>
                <CardContent className="text-yellow-700 dark:text-yellow-300">
                    <p>यदि आपने किसी कोर्स के लिए पेमेंट नहीं किया है और वह आपकी लाइब्रेरी में दिख रहा है, तो कृपया ध्यान दें कि यह जल्द ही हटाया जा सकता है। सही तरीके से एक्सेस जारी रखने के लिए कृपया कोर्स का पेमेंट पूरा करें।</p>
                </CardContent>
            </Card>


            {finalLoading && (
                <div className="flex flex-col items-center justify-center text-center p-12">
                    <Loader className="h-12 w-12 animate-spin mb-4" />
                    <p>आपके कोर्सेस लोड हो रहे हैं...</p>
                </div>
            )}

            {!finalLoading && enrolledCourses.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <BookOpen className="h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold">अभी तक कोई कोर्स नहीं है</h3>
                        <p>आपने अभी तक किसी भी कोर्स में एनरोल नहीं किया है।</p>
                        <Button asChild className="mt-4">
                            <Link href="/courses">कोर्सेस देखें</Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!finalLoading && enrolledCourses.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledCourses.map(course => (
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
                                <div className="flex items-center gap-2 text-green-500">
                                    <ShieldCheck className="h-5 w-5" />
                                    <span className="font-semibold">Enrolled</span>
                                </div>
                                <Button asChild>
                                    <Link href={`/courses/${course.id}/watch`}>पढ़ाई शुरू करें</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
