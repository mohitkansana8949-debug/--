'use client';

import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Video, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export default function ManageLiveContentPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
    const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);

    const handleLiveStatusChange = async (courseId: string, contentId: string, newStatus: boolean) => {
        if (!firestore) return;
        
        const courseRef = doc(firestore, 'courses', courseId);
        
        const course = courses?.find(c => c.id === courseId);
        if (!course) return;

        const updatedContent = course.content.map((item: any) => {
            if (item.id === contentId) {
                return { ...item, isLive: newStatus };
            }
            return item;
        });
        
        const updateData = { content: updatedContent };

        try {
            await updateDoc(courseRef, updateData);
            toast({
                title: 'Status Updated',
                description: `Content status has been changed to ${newStatus ? 'Live' : 'Recorded'}.`,
            });
        } catch (error) {
            console.error("Error updating live status:", error);
            const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: courseRef.path,
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', contextualError);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update the live status.',
            });
        }
    };
    
    const allVideos = courses?.flatMap(course => 
        (course.content || [])
            .filter((c: any) => c.type === 'youtube' || c.type === 'video')
            .map((c: any) => ({ ...c, courseName: course.name, courseId: course.id }))
    ) || [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Live Content</CardTitle>
                <CardDescription>Control which video content is currently "live" across all courses. Live content will have chat enabled for students.</CardDescription>
            </CardHeader>
            <CardContent>
                {coursesLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Content Title</TableHead>
                                <TableHead>Course</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Set Live</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allVideos.map(video => (
                                <TableRow key={video.id}>
                                    <TableCell className='font-medium'>{video.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{video.courseName}</TableCell>
                                    <TableCell>
                                       {video.type === 'youtube' ? <Youtube className="h-5 w-5 text-red-500" /> : <Video className="h-5 w-5" />}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Switch
                                            checked={video.isLive || false}
                                            onCheckedChange={(checked) => handleLiveStatusChange(video.courseId, video.id, checked)}
                                            aria-label={`Toggle live status for ${video.title}`}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!coursesLoading && allVideos.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        No video content found in any course.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
