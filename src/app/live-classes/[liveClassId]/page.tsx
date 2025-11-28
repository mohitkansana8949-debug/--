'use client';
import { useParams } from 'next/navigation';
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


const isLive = (startTime: any) => {
    if (!startTime?.toDate) return false;
    return startTime.toDate() <= new Date();
}

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

  const live = isLive(liveClass.startTime);
  const showLiveChat = liveClass.liveChatId && live;
  
  // If it's a recorded class (i.e., not live), show full screen player
  if (!live) {
    return (
        <div className="fixed inset-0 bg-black z-50 h-screen w-screen">
            <VideoPlayer videoId={liveClass.youtubeVideoId} title={liveClass.teacherName} />
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col lg:flex-row h-screen w-screen p-0 gap-0">
        <div className="flex-grow flex flex-col relative">
            <VideoPlayer videoId={liveClass.youtubeVideoId} title={liveClass.teacherName} />
        </div>
        <div className="w-full lg:w-96 h-1/2 lg:h-full shrink-0 bg-background p-2">
            {showLiveChat ? <RealtimeYouTubeChat liveChatId={liveClass.liveChatId} /> : <DummyChat />}
        </div>
    </div>
  );
}

// Dummy Chat for when real chat is not available
const getColorForId = (id: string) => {
  const colors = [
    'text-red-400', 'text-green-400', 'text-blue-400', 'text-yellow-400', 
    'text-purple-400', 'text-pink-400', 'text-indigo-400', 'text-teal-400',
    'text-orange-400', 'text-cyan-400'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[hash % colors.length];
};

const dummyMessages = [
  { id: '1', name: 'Rahul', message: 'Hello everyone!' },
  { id: '2', name: 'Priya', message: 'Hi Rahul! Excited for the class.' },
  { id: '3', name: 'Amit', message: 'Me too! 🔥' },
  { id: '4', name: 'Sunita', message: 'Can you hear the teacher clearly?' },
  { id: '5', name: 'Vikram', message: 'Yes, audio is perfect on my end.' },
  { id: '6', name: 'Neha', message: 'Great topic today!' },
  { id: '7', name: 'Anjali', message: 'What is the main formula again?' },
  { id: '8', name: 'Sandeep', message: 'It was E=mc^2, Anjali.' },
  { id: '9', name: 'Pooja', message: 'Thanks Sandeep!' },
  { id: '10', name: 'Raj', message: 'This is really interesting.' },
];

function DummyChat() {
  const [messages, setMessages] = useState(dummyMessages.slice(0, 5));

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages(prev => {
        const nextMessageIndex = prev.length % dummyMessages.length;
        const nextMessage = dummyMessages[nextMessageIndex];
        const newMesage = {...nextMessage };
        if (prev.length >= 10) {
          return [...prev.slice(1), newMesage];
        }
        return [...prev, newMesage];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="h-full w-full flex flex-col bg-card/50">
        <div className="p-4 border-b">
            <h3 className="font-semibold text-center">लाइव चैट</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg: any, index: number) => (
                <div key={`${msg.id}-${index}`} className="flex items-start gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${getColorForId(msg.id).replace('text-', 'bg-')}`}>
                        {msg.name.charAt(0)}
                    </div>
                    <div>
                        <p className={`font-bold text-sm ${getColorForId(msg.id)}`}>{msg.name}</p>
                        <p className="text-sm">{msg.message}</p>
                    </div>
                </div>
            ))}
        </div>
    </Card>
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
            pollingTimeoutRef.current = setTimeout(fetchMessages, result.pollingIntervalMillis);

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
                    {messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-3">
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
