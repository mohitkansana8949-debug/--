
'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader, Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function ManageLiveClassPage() {
  const { firestore } = useFirebase();

  const liveClassesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'liveClasses') : null),
    [firestore]
  );
  const { data: liveClasses, isLoading: liveClassesLoading } = useCollection(liveClassesQuery);


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
                                <Button variant="outline" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="destructive" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
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
