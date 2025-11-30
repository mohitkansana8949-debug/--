
'use client';

import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Video, Youtube, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function ManageLiveContentPage() {
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const coursesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'courses') : null), [firestore]);
    const { data: courses, isLoading: coursesLoading } = useCollection(coursesQuery);
    
    const liveLecturesQuery = useMemoFirebase(() => (firestore ? collection(firestore, 'liveLectures') : null), [firestore]);
    const { data: liveLectures, isLoading: liveLecturesLoading } = useCollection(liveLecturesQuery);

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

    const handleDeleteLiveLecture = async (lectureId: string) => {
        if (!firestore) return;
        try {
            await deleteDoc(doc(firestore, 'liveLectures', lectureId));
            toast({ title: "Success", description: "Live lecture has been deleted." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete live lecture." });
            console.error("Error deleting live lecture:", error);
        }
    };
    
    const allVideos = courses?.flatMap(course => 
        (course.content || [])
            .filter((c: any) => c.type === 'youtube' || c.type === 'video')
            .map((c: any) => ({ ...c, courseName: course.name, courseId: course.id, isStandalone: false }))
    ) || [];

    const allLiveContent = [...allVideos, ...(liveLectures || []).map(l => ({ ...l, isStandalone: true }))];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Manage Live Content</CardTitle>
                <CardDescription>Control which video content is currently "live". Live content will have chat enabled for students.</CardDescription>
            </CardHeader>
            <CardContent>
                {coursesLoading || liveLecturesLoading ? (
                    <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Content Title</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Set Live</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allLiveContent.map(content => (
                                <TableRow key={content.id}>
                                    <TableCell className='font-medium'>{content.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{content.isStandalone ? "Standalone Lecture" : content.courseName}</TableCell>
                                    <TableCell>
                                       {content.type === 'youtube' ? <Youtube className="h-5 w-5 text-red-500" /> : <Video className="h-5 w-5" />}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={content.isLive || false}
                                            onCheckedChange={(checked) => content.isStandalone ? null : handleLiveStatusChange(content.courseId, content.id, checked)}
                                            disabled={content.isStandalone}
                                            aria-label={`Toggle live status for ${content.title}`}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {content.isStandalone && (
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This will permanently delete the live lecture "{content.title}".</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteLiveLecture(content.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!coursesLoading && !liveLecturesLoading && allLiveContent.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No live video content found.
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
