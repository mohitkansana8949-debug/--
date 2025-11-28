'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Send, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

// Helper function to get a color based on user ID
const getColorForId = (id: string) => {
  const colors = [
    'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500'
  ];
  let hash = 0;
  if (!id) return colors[0];
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getTextColorForId = (id: string) => {
  const colors = [
    'text-red-400', 'text-green-400', 'text-blue-400', 'text-yellow-400', 
    'text-purple-400', 'text-pink-400', 'text-indigo-400', 'text-teal-400',
    'text-orange-400', 'text-cyan-400'
  ];
    let hash = 0;
  if (!id) return colors[0];
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

type RealtimeChatProps = {
  chatId: string;
};

export default function RealtimeChat({ chatId }: RealtimeChatProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc')) : null,
    [firestore, chatId]
  );
  const { data: messages, isLoading, error } = useCollection(messagesQuery);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !firestore || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(firestore, 'chats', chatId, 'messages'), {
        text: newMessage,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userPhotoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally show a toast notification
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (viewport) {
      setTimeout(() => {
        viewport.scrollTop = viewport.scrollHeight;
      }, 100);
    }
  }, [messages]);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'A';
    return name.substring(0, 1).toUpperCase();
  }

  return (
    <div className="h-full w-full flex flex-col bg-card/50">
        <div className="p-4 border-b">
            <h3 className="font-semibold text-center">लाइव चैट</h3>
        </div>
        
        <ScrollArea className="flex-1" ref={scrollViewportRef}>
            <div className="p-4 space-y-4">
            {isLoading && (
                 <div className="flex justify-center p-4">
                    <Loader className="animate-spin" />
                 </div>
            )}
            {messages?.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={msg.userPhotoURL} alt={msg.userName} />
                       <AvatarFallback className={`text-white font-bold ${getColorForId(msg.userId)}`}>
                            {getInitials(msg.userName)}
                       </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className={`font-bold text-sm ${getTextColorForId(msg.userId)}`}>{msg.userName}</p>
                        <p className="text-sm text-foreground/90 break-words">{msg.text}</p>
                    </div>
                </div>
            ))}
             {error && (
                <div className="text-center text-destructive text-sm p-4">
                    <AlertTriangle className="mx-auto mb-2 h-6 w-6"/>
                    Could not load chat.
                </div>
            )}
            </div>
        </ScrollArea>
        
        <div className="p-2 border-t mt-auto bg-background">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Input 
                    placeholder="संदेश लिखें..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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
