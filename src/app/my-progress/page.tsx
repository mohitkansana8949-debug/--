
'use client';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';
import { Trophy, Loader, BookOpen, Book as EbookIcon, FileQuestion, Newspaper } from 'lucide-react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
  ArcElement,
} from 'chart.js';
import { PolarArea, Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement
);

type ProgressData = {
    total: number;
    completed: number;
    percentage: number;
};

type CategoryProgress = {
    courses: ProgressData;
    ebooks: ProgressData;
    pyqs: ProgressData;
    tests: ProgressData;
};

export default function MyProgressPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    
    const [categoryProgress, setCategoryProgress] = useState<CategoryProgress | null>(null);

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
      () => user ? query(collection(firestore, 'enrollments'), where('userId', '==', user.uid), where('status', '==', 'approved')) : null,
      [user, firestore]
    );
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

    const calculateProgress = useCallback(() => {
        if (!enrollments || !allCourses || !allEbooks || !allPyqs || !allTests) {
            return;
        }

        const enrolledItemIds = new Map(enrollments.map(e => [e.itemId, e.itemType]));

        const getProgress = (items: any[], type: string): ProgressData => {
            const total = items.length;
            if (total === 0) return { total: 0, completed: 0, percentage: 0 };
            const completed = items.filter(item => enrolledItemIds.has(item.id) && enrolledItemIds.get(item.id) === type).length;
            return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
        };

        setCategoryProgress({
            courses: getProgress(allCourses, 'course'),
            ebooks: getProgress(allEbooks, 'ebook'),
            pyqs: getProgress(allPyqs, 'pyq'),
            tests: getProgress(allTests, 'test'),
        });

    }, [allCourses, allEbooks, allPyqs, allTests, enrollments]);

    useEffect(() => {
        calculateProgress();
    }, [calculateProgress]);
    
    const isLoading = isUserLoading || coursesLoading || ebooksLoading || pyqsLoading || testsLoading || enrollmentsLoading;
    
    const overallProgress = useMemo(() => {
        if (!categoryProgress) return { total: 0, completed: 0, percentage: 0 };
        const total = categoryProgress.courses.total + categoryProgress.ebooks.total + categoryProgress.pyqs.total + categoryProgress.tests.total;
        const completed = categoryProgress.courses.completed + categoryProgress.ebooks.completed + categoryProgress.pyqs.completed + categoryProgress.tests.completed;
        return { total, completed, percentage: total > 0 ? (completed / total) * 100 : 0 };
    }, [categoryProgress]);

    const chartData: ChartData<"polarArea"> = {
        labels: ['Courses', 'E-books', 'PYQs', 'Tests'],
        datasets: [
          {
            label: '% Completion',
            data: [
              categoryProgress?.courses.percentage || 0,
              categoryProgress?.ebooks.percentage || 0,
              categoryProgress?.pyqs.percentage || 0,
              categoryProgress?.tests.percentage || 0,
            ],
            backgroundColor: [
              'rgba(54, 162, 235, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(255, 99, 132, 0.5)',
            ],
            borderWidth: 1,
          },
        ],
    };

    const progressCards = [
        { title: 'Courses', icon: BookOpen, data: categoryProgress?.courses },
        { title: 'E-books', icon: EbookIcon, data: categoryProgress?.ebooks },
        { title: 'PYQs', icon: FileQuestion, data: categoryProgress?.pyqs },
        { title: 'Tests', icon: Newspaper, data: categoryProgress?.tests },
    ]

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2">My Progress</h1>
            <p className="text-muted-foreground mb-8">Track your learning journey through all our content.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <Card className="flex flex-col items-center justify-center p-6 text-center">
                     <CardTitle className="mb-4">Overall Completion</CardTitle>
                    {isLoading ? <Loader className="animate-spin h-24 w-24"/> : (
                        <div className="relative h-48 w-48">
                            <PolarArea 
                                data={chartData} 
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        r: {
                                            min: 0,
                                            max: 100,
                                            ticks: { display: false },
                                            grid: { color: 'rgba(255, 255, 255, 0.1)' }
                                        }
                                    },
                                    plugins: { legend: { display: false } }
                                }}
                            />
                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-bold">{Math.round(overallProgress.percentage)}%</span>
                                <span className="text-sm text-muted-foreground">{overallProgress.completed} / {overallProgress.total}</span>
                             </div>
                        </div>
                    )}
                </Card>
                <div className="space-y-4">
                    {progressCards.map(card => (
                        <Card key={card.title}>
                             <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <card.icon className="h-8 w-8 text-primary"/>
                                    <div className="w-full">
                                        <div className="flex justify-between font-semibold">
                                            <span>{card.title}</span>
                                            <span>{card.data?.completed || 0} / {card.data?.total || 0}</span>
                                        </div>
                                        <Progress value={card.data?.percentage || 0} className="h-2 mt-1" />
                                    </div>
                                </div>
                             </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

             <div className="text-center text-sm text-muted-foreground p-4 mt-8 rounded-lg border bg-card">
                <Trophy className="mx-auto h-8 w-8 text-yellow-500 mb-2"/>
                <p className="font-semibold">Complete 100% and get a ₹20 reward!</p>
                <p>Finish all courses, e-books, and tests to claim your prize.</p>
            </div>
        </div>
    )
}
