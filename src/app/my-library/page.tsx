
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Loader, ShieldCheck, ShieldX } from "lucide-react";
import { useUser, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, doc, getDoc, DocumentSnapshot, DocumentData } from 'firebase/firestore';
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
            if (!enrollmentsLoading) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const coursePromises: Promise<DocumentSnapshot<DocumentData>>[] = enrollments.map(enrollment => {
                const courseDocRef = doc(firestore, 'courses', enrollment.courseId);
                return getDoc(courseDocRef);
            });
            
            const courseDocs = await Promise.all(coursePromises);

            const coursesData = courseDocs
                .filter(docSnap => docSnap.exists())
                .map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as EnrolledCourse));
            
            setEnrolledCourses(coursesData);
        } catch (error) {
            console.error("Error fetching course details:", error);
        } finally {
            setIsLoading(false);
        }
    }, [enrollments, firestore, enrollmentsLoading]);

    useEffect(() => {
        fetchCourseDetails();
    }, [fetchCourseDetails]);

    const finalLoading = isUserLoading || isLoading;

    return (
        <div className="container mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">मेरी लाइब्रेरी</h1>
                <p className="text-muted-foreground">
                    आपके द्वारा एनरोल किए गए कोर्सेस।
                </p>
            </div>
            
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
                            <Image 
                                src={course.thumbnailUrl} 
                                alt={course.name} 
                                width={600}
                                height={400}
                                className="rounded-t-lg object-cover w-full h-48"
                            />
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
