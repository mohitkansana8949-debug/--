
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, ArrowLeft } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditCourseContentPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
    [firestore, courseId]
  );
  const { data: course, isLoading: courseLoading } = useDoc(courseRef);

  useEffect(() => {
    if (course) {
      setContent(course.content || '');
    }
  }, [course]);

  const handleContentUpdate = async () => {
    if (!firestore || !courseRef) return;

    setIsSubmitting(true);
    
    const updateData = { content };

    updateDoc(courseRef, updateData)
      .then(() => {
        toast({ title: 'सफलता!', description: 'कंटेंट सफलतापूर्वक अपडेट हो गया है।' });
        router.push('/admin/content');
      })
      .catch((error) => {
        console.error("Content update error:", error);
        const contextualError = new FirestorePermissionError({
          operation: 'update',
          path: courseRef.path,
          requestResourceData: updateData,
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/content">
            <ArrowLeft className="mr-2 h-4 w-4" />
            कंटेंट लिस्ट पर वापस जाएं
          </Link>
        </Button>
      </div>
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          {courseLoading ? (
            <>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </>
          ) : (
            <>
              <CardTitle>कंटेंट एडिट करें: {course?.name}</CardTitle>
              <CardDescription>इस कोर्स के कंटेंट को एडिट करें। आप HTML का उपयोग कर सकते हैं।</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent>
            {courseLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-10 w-32" />
                </div>
            ) : (
                <div className="space-y-6">
                    <Textarea
                        placeholder="कोर्स कंटेंट यहाँ लिखें..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={20}
                        className="text-base"
                    />
                    <Button onClick={handleContentUpdate} disabled={isSubmitting}>
                        {isSubmitting ? (
                        <><Loader className="mr-2 h-4 w-4 animate-spin" /> सेव हो रहा है...</>
                        ) : (
                        'कंटेंट सेव करें'
                        )}
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
