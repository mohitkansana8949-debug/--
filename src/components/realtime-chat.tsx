'use client';

import { useState, useRef, useEffect } from 'react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper function to get a color based on user ID
const getColorForId = (id: string) => {
  const colors = [
    'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500'
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[hash % colors.length];
};

const getTextColorForId = (id: string) => {
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

type RealtimeChatProps = {
  chatId: string;
};

export default function RealtimeChat({ chatId }: RealtimeChatProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(
    () => (firestore && chatId ? 
        query(
            collection(firestore, `chats/${chatId}/messages`),
            orderBy('createdAt', 'asc'),
            limit(50) // Limit to last 50 messages for performance
        ) 
        : null),
    [firestore, chatId]
  );

  const { data: messages, isLoading } = useCollection(messagesQuery);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollViewportRef.current) {
        setTimeout(() => {
            if (scrollViewportRef.current) {
                scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
            }
        }, 100);
    }
  }, [messages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !newMessage.trim()) return;

    setIsSending(true);
    const messagesCollection = collection(firestore, `chats/${chatId}/messages`);
    const messageData = {
      text: newMessage,
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(messagesCollection, messageData);
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      const contextualError = new FirestorePermissionError({
        operation: 'create',
        path: messagesCollection.path,
        requestResourceData: messageData,
      });
      errorEmitter.emit('permission-error', contextualError);
    } finally {
      setIsSending(false);
    }
  };
  
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'A';
    return name.substring(0, 1).toUpperCase();
  }

  return (
    <div className="h-full w-full flex flex-col bg-card/50">
        <div className="p-4 border-b">
            <h3 className="font-semibold text-center">चैट</h3>
        </div>
        
        <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
            <div className="p-4 space-y-4">
            {isLoading && <div className="flex justify-center p-4"><Loader className="animate-spin" /></div>}
            {messages?.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className={`text-white font-bold ${getColorForId(msg.userId)}`}>
                            {getInitials(msg.userName)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className={`font-bold text-sm ${getTextColorForId(msg.userId)}`}>{msg.userName}</p>
                        <p className="text-sm text-foreground/90">{msg.text}</p>
                    </div>
                </div>
            ))}
            </div>
        </ScrollArea>
        
        <div className="p-4 border-t mt-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="एक मैसेज लिखें..."
                    disabled={!user || isSending}
                />
                <Button type="submit" size="icon" disabled={!user || isSending || !newMessage.trim()}>
                    {isSending ? <Loader className="animate-spin" /> : <Send />}
                </Button>
            </form>
        </div>
    </div>
  );
}
