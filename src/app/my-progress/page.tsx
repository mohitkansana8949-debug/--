
'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { Trophy, Loader } from 'lucide-react';

export default function MyProgressPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [progress, setProgress] = useState(0);

    // Queries for all content types
    const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
    const ebooksQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'ebooks') : null), [firestore]);
    const pyqsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'pyqs') : null), [firestore]);
    const testsQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'tests') : null), [firestore]);

    const { data: allCourses, isLoading: coursesLoading } = useCollection(coursesQuery);
    const { data: allEbooks, isLoading: ebooksLoading } = useCollection(ebooksQuery);
    const { data: allPyqs, isLoading: pyqsLoading } = useCollection(pyqsQuery);
    const { data: allTests, isLoading: testsLoading } = useCollection(testsQuery);

    const enrollmentsQuery = useMemoFirebase(
      () => user ? query(collection(firestore, 'enrollments'), where('userId', '==', user.uid)) : null,
      [user, firestore]
    );
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

    const calculateProgress = useCallback(() => {
        if (!user || !enrollments || !allCourses || !allEbooks || !allPyqs || !allTests) {
            setProgress(0);
            return;
        }
        const totalItems = (allCourses?.length || 0) + (allEbooks?.length || 0) + (allPyqs?.length || 0) + (allTests?.length || 0);
        const approvedEnrollments = new Set(enrollments.filter(e => e.status === 'approved').map(e => e.itemId));
        
        if (totalItems === 0) {
            setProgress(0);
            return;
        }
        
        const progressPercentage = (approvedEnrollments.size / totalItems) * 100;
        setProgress(Math.min(100, progressPercentage));

    }, [allCourses, allEbooks, allPyqs, allTests, enrollments, user]);

    useEffect(() => {
        calculateProgress();
    }, [calculateProgress]);
    
    const isLoading = isUserLoading || coursesLoading || ebooksLoading || pyqsLoading || testsLoading || enrollmentsLoading;

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">My Progress</h1>
            <p className="text-muted-foreground mb-8">Track your learning journey through all our content.</p>
            
            <Card>
                <CardHeader>
                    <CardTitle>Overall Completion</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                         <div className="space-y-4">
                            <div className="flex justify-between items-center mb-1">
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-5 w-12" />
                            </div>
                            <Skeleton className="h-8 w-full" />
                         </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-muted-foreground">Completion</span>
                                <span className="font-bold text-primary">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-8" />
                            <div className="text-center text-sm text-muted-foreground p-4 mt-2 rounded-lg border bg-card">
                                <Trophy className="mx-auto h-8 w-8 text-yellow-500 mb-2"/>
                                <p className="font-semibold">Complete 100% and get a ₹20 reward!</p>
                                <p>Finish all courses, e-books, and tests to claim your prize.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
