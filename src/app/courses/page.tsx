'use client';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Mock data, to be replaced with Firestore data
const allCourses = [
  { id: '1', name: 'Intro to React', description: 'Learn the fundamentals of React.', isFree: true, price: 0, thumbnailUrl: 'https://picsum.photos/seed/react/600/400' },
  { id: '2', name: 'Advanced TypeScript', description: 'Master TypeScript for large-scale applications.', isFree: false, price: 99.99, thumbnailUrl: 'https://picsum.photos/seed/ts/600/400' },
  { id: '3', name: 'Next.js for Beginners', description: 'Build server-rendered React apps with Next.js.', isFree: true, price: 0, thumbnailUrl: 'https://picsum.photos/seed/nextjs/600/400' },
  { id: '4', name: 'Firebase Deep Dive', description: 'A comprehensive guide to the Firebase platform.', isFree: false, price: 129.99, thumbnailUrl: 'https://picsum.photos/seed/firebase/600/400' },
];

export default function CoursesPage() {
    const searchParams = useSearchParams();
    const filter = searchParams.get('filter');

    const filteredCourses = allCourses.filter(course => {
        if (filter === 'free') return course.isFree;
        if (filter === 'paid') return !course.isFree;
        return true;
    });
    
    const title = filter === 'free' ? 'Free Courses' : filter === 'paid' ? 'Paid Courses' : 'All Courses';

    return (
        <div className="container mx-auto p-4">
             <div className="mb-8">
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="text-muted-foreground">
                    Browse our catalog of courses.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => (
                    <Card key={course.id}>
                        <img src={course.thumbnailUrl} alt={course.name} className="rounded-t-lg object-cover w-full h-48" />
                        <CardHeader>
                            <CardTitle>{course.name}</CardTitle>
                            <CardDescription>{course.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <p className="text-lg font-bold">{course.isFree ? 'Free' : `$${course.price}`}</p>
                            <Button asChild>
                                <Link href={`/courses/${course.id}`}>View Course</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
