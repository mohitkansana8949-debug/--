
'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
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
import { errorEmitter, FirestorePermissionError } from '@/firebase';


export default function ManageLiveClassPage() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const liveClassesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'liveClasses') : null),
    [firestore]
  );
  const { data: liveClasses, isLoading: liveClassesLoading } = useCollection(liveClassesQuery);

  const handleDelete = async (liveClassId: string) => {
    if (!firestore) return;
    setDeletingId(liveClassId);

    const docRef = doc(firestore, 'liveClasses', liveClassId);

    try {
      await deleteDoc(docRef);
      toast({
        title: "सफलता!",
        description: "लाइव क्लास सफलतापूर्वक हटा दी गई है।",
      });
    } catch (error) {
      console.error("Error deleting live class: ", error);
      const contextualError = new FirestorePermissionError({
        operation: 'delete',
        path: docRef.path
      });
      errorEmitter.emit('permission-error', contextualError);
    } finally {
      setDeletingId(null);
    }
  };


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>शेड्यूल की गई लाइव क्लासेस</CardTitle>
          <CardDescription>यहां सभी आने वाली और हो चुकी लाइव क्लासेस की लिस्ट देखें।</CardDescription>
        </CardHeader>
        <CardContent>
          {liveClassesLoading ? (
             <div className="flex justify-center p-8"><Loader className="animate-spin"/></div>
          ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>टीचर</TableHead>
                        <TableHead>वीडियो ID</TableHead>
                        <TableHead>समय</TableHead>
                        <TableHead>एक्शन</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {liveClasses?.map(lc => (
                        <TableRow key={lc.id}>
                            <TableCell>{lc.teacherName}</TableCell>
                            <TableCell className="font-mono">{lc.youtubeVideoId}</TableCell>
                            <TableCell>{lc.startTime ? format(lc.startTime.toDate(), 'PPp') : 'N/A'}</TableCell>
                             <TableCell className="space-x-2">
                                <Button variant="outline" size="icon" disabled>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                 <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="icon" disabled={deletingId === lc.id}>
                                      {deletingId === lc.id ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>क्या आप वाकई निश्चित हैं?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        यह एक्शन वापस नहीं लिया जा सकता। यह इस लाइव क्लास को स्थायी रूप से हटा देगा।
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>रद्द करें</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(lc.id)}>
                                        हटाएँ
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                     {!liveClassesLoading && liveClasses?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                कोई लाइव क्लास शेड्यूल नहीं है।
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
