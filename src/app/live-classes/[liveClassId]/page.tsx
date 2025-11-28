'use client';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, AlertTriangle, Send } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import VideoPlayer from '@/components/player/video-player';
import { getLiveChatMessages, type LiveChatMessage } from '@/ai/flows/youtube-live-chat-flow';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Timestamp } from 'firebase/firestore';


const isPast = (startTime: Timestamp) => {
    if (!startTime?.toDate) return false;
    return startTime.toDate() < new Date();
};

export default function LiveClassWatchPage() {
  const { liveClassId } = useParams();
  const firestore = useFirestore();

  const liveClassRef = useMemoFirebase(
    () => (firestore && liveClassId ? doc(firestore, 'liveClasses', liveClassId as string) : null),
    [firestore, liveClassId]
  );
  const { data: liveClass, isLoading } = useDoc(liveClassRef);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <Loader className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold">लाइव क्लास नहीं मिली</h2>
        <p>हो सकता है कि यह क्लास हटा दी गई हो या लिंक गलत हो।</p>
      </div>
    );
  }

  const isClassPast = isPast(liveClass.startTime);
  const showLiveChat = !isClassPast && liveClass.liveChatId;
  
  // If it's a recorded (past) class, show full screen player
  if (isClassPast) {
    return (
        <div className="fixed inset-0 bg-black z-50 h-screen w-screen">
            <VideoPlayer title={liveClass.teacherName} videoId={liveClass.youtubeVideoId} />
        </div>
    )
  }

  // If it is an upcoming or current live class, show the player with chat
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col lg:flex-row h-screen w-screen p-0 gap-0">
        <div className="flex-grow flex flex-col relative">
            <VideoPlayer title={liveClass.teacherName} videoId={liveClass.youtubeVideoId} />
        </div>
        <div className="w-full lg:w-96 h-1/2 lg:h-full shrink-0 bg-background p-2">
            {showLiveChat ? <RealtimeYouTubeChat liveChatId={liveClass.liveChatId} /> : <div className="flex h-full items-center justify-center text-muted-foreground">लाइव शुरू होने पर चैट यहां दिखेगी।</div>}
        </div>
    </div>
  );
}

// Realtime YouTube Chat Component
function RealtimeYouTubeChat({ liveChatId }: { liveChatId: string }) {
    const [messages, setMessages] = useState<LiveChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const nextPageTokenRef = useRef<string | undefined>(undefined);
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchMessages = async () => {
        try {
            const result = await getLiveChatMessages({
                liveChatId,
                nextPageToken: nextPageTokenRef.current
            });

            setMessages(prev => [...prev, ...result.messages]);
            nextPageTokenRef.current = result.nextPageToken;
            setError(null);
            
            // Schedule next poll
            pollingTimeoutRef.current = setTimeout(fetchMessages, result.pollingIntervalMillis || 5000);

        } catch (err: any) {
            console.error("Error fetching YouTube chat:", err);
            setError(err.message || 'Could not load chat.');
             // Stop polling on error
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
            }
        }
    };
    
    useEffect(() => {
        fetchMessages();

        return () => {
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
            }
        };
    }, [liveChatId]);

    useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Card className="h-full w-full flex flex-col bg-card/50">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-center">लाइव चैट (YouTube)</h3>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4" ref={scrollViewportRef}>
                    {messages.map((msg, index) => (
                        <div key={`${msg.id}-${index}`} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.authorPhotoUrl} alt={msg.authorName} />
                                <AvatarFallback>{msg.authorName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold text-sm text-muted-foreground">{msg.authorName}</p>
                                <p className="text-sm text-foreground/90">{msg.messageText}</p>
                            </div>
                        </div>
                    ))}
                    {error && (
                        <div className="text-center text-destructive text-sm p-4">
                           <AlertTriangle className="mx-auto mb-2 h-6 w-6"/>
                           {error}
                        </div>
                    )}
                </div>
            </ScrollArea>
            
            <div className="p-4 border-t mt-auto bg-muted/50">
                <p className="text-center text-xs text-muted-foreground">
                    चैट करने के लिए, कृपया YouTube पर वीडियो देखें।
                </p>
            </div>
        </Card>
    );
}
