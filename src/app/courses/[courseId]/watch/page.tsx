
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader } from 'lucide-react';
import VideoPlayer from '@/components/player/video-player';
import RealtimeChat from '@/components/realtime-chat';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';


// Helper function to extract YouTube Video ID from any URL format
const getYouTubeID = (url: string): string | null => {
  if (!url) return null;

  let ID = '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      ID = urlObj.pathname.substring(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname === '/watch') {
        ID = urlObj.searchParams.get('v') || '';
      } else if (urlObj.pathname.startsWith('/live/')) {
        ID = urlObj.pathname.split('/live/')[1];
      } else if (urlObj.pathname.startsWith('/embed/')) {
        ID = urlObj.pathname.split('/embed/')[1];
      }
    }
    
    // Remove any extra query parameters from the ID
    if (ID.includes('?')) {
        ID = ID.split('?')[0];
    }
    return ID || null;

  } catch (e) {
     // Fallback for non-URL strings or invalid formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|live\/|v\/|)([\w-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  
  return null;
}

export default function WatchCoursePage() {
  const { courseId } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();

  const courseRef = useMemoFirebase(
    () => (firestore && courseId ? doc(firestore, 'courses', courseId as string) : null),
    [firestore, courseId]
  );
  const { data: course, isLoading: courseLoading } = useDoc(courseRef);

  if (courseLoading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center"><Loader className="animate-spin text-white" /></div>;
  }

  const videoId = course?.content ? getYouTubeID(course.content) : null;
  const title = course?.name || 'वीडियो';

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col lg:flex-row h-screen w-screen p-0 gap-0">
      <div className="flex-grow flex flex-col relative">
        <VideoPlayer videoId={videoId} title={title} />
      </div>
      <div className="w-full lg:w-96 h-1/2 lg:h-full shrink-0 bg-background p-2">
         {/* Using Dummy Chat as requested */}
         <DummyChat />
      </div>
    </div>
  );
}


// Duplicating DummyChat here for now. Can be centralized later.
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
        // Create a new unique object for the key prop
        const newMesage = {...nextMessage};
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
