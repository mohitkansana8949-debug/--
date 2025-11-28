'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader, AlertTriangle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getLiveChatMessages, type LiveChatMessage } from '@/ai/flows/youtube-live-chat-flow';

// This component is for replaying a chat from a completed stream.
export default function YouTubeChatReplay({ liveChatId }: { liveChatId: string }) {
    const [messages, setMessages] = useState<LiveChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const nextPageTokenRef = useRef<string | undefined>(undefined);
    const scrollViewportRef = useRef<HTMLDivElement>(null);
    const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isFetching = useRef(false);

    const fetchMessages = async () => {
        if(isFetching.current) return;
        isFetching.current = true;
        try {
            const result = await getLiveChatMessages({
                liveChatId,
                nextPageToken: nextPageTokenRef.current
            });

            if (result.messages.length > 0) {
              setMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const newMessages = result.messages.filter(m => !existingIds.has(m.id));
                return [...prev, ...newMessages];
              });
            }

            nextPageTokenRef.current = result.nextPageToken;
            setError(null);
            
            // If there's a next page token, keep fetching.
            if(result.nextPageToken) {
                pollingTimeoutRef.current = setTimeout(fetchMessages, result.pollingIntervalMillis || 7000);
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
    }, [liveChatId]);

    useEffect(() => {
        if (scrollViewportRef.current) {
            scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Card className="h-full w-full flex flex-col bg-card/50">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-center">लाइव चैट रिप्ले</h3>
            </div>
            
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4" ref={scrollViewportRef}>
                    {messages.length === 0 && !error && (
                         <div className="flex justify-center items-center h-full">
                            <Loader className="animate-spin" />
                         </div>
                    )}
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
                    यह चैट का रिकॉर्डेड वर्जन है।
                </p>
            </div>
        </Card>
    );
}