
'use client';

import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader, Video, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getYouTubeID } from '@/lib/youtube';
import { Button } from '@/components/ui/button';

type DemoItemType = {
  id: string;
  type: 'video' | 'pdf';
  title: string;
  url: string;
};

function DemoItem({ item }: { item: DemoItemType }) {
    const getIcon = () => {
        switch(item.type) {
            case 'video': return <Video className="h-5 w-5 shrink-0 text-red-500" />;
            case 'pdf': return <FileText className="h-5 w-5 shrink-0" />;
            default: return null;
        }
    };

    const getLink = () => {
        if (item.type === 'pdf') {
            return `/pdf-viewer?url=${encodeURIComponent(item.url)}`;
        }
        const videoId = getYouTubeID(item.url);
        if (videoId) {
             const url = `/courses/watch/${videoId}?live=false`;
             return url;
        }
        return `/courses/watch/external?url=${encodeURIComponent(item.url)}&live=false`;
    };

    return (
         <Link href={getLink()} target={item.type === 'pdf' ? '_blank' : '_self'}>
            <Card className="cursor-pointer hover:bg-muted">
                <CardContent className="p-3 flex gap-3 items-center">
                    {getIcon()}
                    <div className="flex-1">
                        <p className="font-semibold text-sm line-clamp-2">{item.title}</p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function DemoPage() {
    const firestore = useFirestore();
    const demoContentQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'demoContent'), orderBy('createdAt', 'desc')) : null),
        [firestore]
    );
    const { data: demoItems, isLoading: demoLoading } = useCollection<DemoItemType>(demoContentQuery);


  if (demoLoading) {
    return <div className="fixed inset-0 bg-background flex items-center justify-center"><Loader className="animate-spin" /></div>;
  }
  
  return (
    <div className="container mx-auto p-4">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">डेमो कोर्स</CardTitle>
          <CardDescription>हमारे कुछ सैंपल वीडियो और नोट्स देखें।</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           {demoItems && demoItems.length > 0 ? demoItems.map((item: any) => (
             <DemoItem key={item.id} item={item} />
           )) : (
            <div className="text-center text-muted-foreground p-8">
                 <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p>डेमो के लिए अभी कोई कंटेंट नहीं है।</p>
                <p className="text-xs">एडमिन पैनल में 'Demo Content' सेक्शन से जोड़ें।</p>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
