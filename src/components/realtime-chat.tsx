'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '@/firebase';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader, Send, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLiveChatMessages, type LiveChatMessage } from '@/ai/flows/youtube-live-chat-flow';


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
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const nextPageTokenRef = useRef<string | undefined>(undefined);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetching = useRef(false);

  const fetchMessages = async () => {
        if(isFetching.current || !chatId) return;
        isFetching.current = true;
        try {
            const result = await getLiveChatMessages({
                liveChatId: chatId,
                nextPageToken: nextPageTokenRef.current
            });

            if (result.messages.length > 0) {
              setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = result.messages.filter(m => !existingIds.has(m.id));
                // Sort by publishedAt just in case
                return [...prev, ...newMessages].sort((a,b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
              });
            }

            nextPageTokenRef.current = result.nextPageToken;
            setError(null);
            
            // If there's a next page token, keep fetching.
            if(result.nextPageToken) {
                pollingTimeoutRef.current = setTimeout(fetchMessages, result.pollingIntervalMillis || 5000);
            }

        } catch (err: any) {
            console.error("Error fetching YouTube chat:", err);
            setError(err.message || 'Could not load chat.');
            if (pollingTimeoutRef.current) {
                clearTimeout(pollingTimeoutRef.current);
            }
        } finally {
            isFetching.current = false;
        }
    };
    
    useEffect(() => {
        fetchMessages();
        return () => {
            if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
        };
    }, [chatId]);


    useEffect(() => {
        const viewport = scrollViewportRef.current;
        if (viewport) {
            // A slight delay to allow the DOM to update
            setTimeout(() => {
                // Scroll to bottom only if user is already near the bottom
                if (viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 200) {
                    viewport.scrollTop = viewport.scrollHeight;
                }
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
        
        <ScrollArea className="flex-1" viewportRef={scrollViewportRef}>
            <div className="p-4 space-y-4">
            {messages.length === 0 && !error && (
                 <div className="flex justify-center p-4">
                    <Loader className="animate-spin" />
                 </div>
            )}
            {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                       <AvatarImage src={msg.authorPhotoUrl} alt={msg.authorName} />
                       <AvatarFallback className={`text-white font-bold ${getColorForId(msg.authorName)}`}>
                            {getInitials(msg.authorName)}
                       </AvatarFallback>
                    </Avatar>
                    <div>
                        <p className={`font-bold text-sm ${getTextColorForId(msg.authorName)}`}>{msg.authorName}</p>
                        <p className="text-sm text-foreground/90 break-words">{msg.messageText}</p>
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
        
        <div className="p-4 border-t mt-auto">
             <p className="text-center text-xs text-muted-foreground">
                यह चैट YouTube से लाइव है।
            </p>
        </div>
    </div>
  );
}