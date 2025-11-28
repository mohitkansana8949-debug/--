
'use client';
import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Loader, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import VideoPlayer from '@/components/player/video-player';

// Helper function to get a color based on user ID
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
    }, 2000); // Add a new message every 2 seconds

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

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col lg:flex-row h-screen w-screen p-0 gap-0">
        <div className="flex-grow flex flex-col relative">
            <VideoPlayer videoId={liveClass.youtubeVideoId} title={liveClass.teacherName} />
        </div>
        <div className="w-full lg:w-96 h-1/2 lg:h-full shrink-0 bg-background p-2">
            <DummyChat />
        </div>
    </div>
  );
}
