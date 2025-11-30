
'use client';
import { useState } from 'react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Wand2, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { solveDoubt } from '@/ai/flows/doubt-solver-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Message = {
    sender: 'user' | 'bot';
    text: string;
};

export default function AiDoubtSolverPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const [doubt, setDoubt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSolveDoubt = async () => {
        if (!doubt.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter your doubt.' });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to ask a doubt.' });
            return;
        }

        const userMessage: Message = { sender: 'user', text: doubt };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setDoubt('');

        try {
            const response = await solveDoubt({
                doubt,
                userId: user.uid,
                userName: user.displayName || 'Student',
            });
            const botMessage: Message = { sender: 'bot', text: response.answer };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("AI Doubt Solver error:", error);
            const errorMessage: Message = { sender: 'bot', text: "Sorry, I couldn't process your request right now. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
            toast({ variant: 'destructive', title: 'AI Error', description: 'There was an issue with the AI service.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl h-full flex flex-col">
            <Card className="flex-1 flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 className="text-primary h-6 w-6"/>
                        AI Doubt Solver
                    </CardTitle>
                    <CardDescription>
                        Ask any question related to your studies, and our AI will help you out.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 overflow-y-auto">
                    {messages.length === 0 && (
                         <div className="text-center text-muted-foreground p-8">
                            <p>Ask a question to get started!</p>
                        </div>
                    )}
                    {messages.map((message, index) => (
                        <div key={index} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : ''}`}>
                            {message.sender === 'bot' && (
                                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                                    <AvatarFallback><Bot size={20} /></AvatarFallback>
                                </Avatar>
                            )}
                             <div className={`p-3 rounded-lg max-w-sm ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            </div>
                            {message.sender === 'user' && <Avatar className="h-8 w-8"><AvatarImage src={user?.photoURL || ''} /><AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback></Avatar>}
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 bg-primary text-primary-foreground"><AvatarFallback><Bot size={20} /></AvatarFallback></Avatar>
                            <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                                <Loader className="animate-spin h-4 w-4"/>
                                <p className="text-sm text-muted-foreground">Thinking...</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardContent className="border-t pt-4">
                    <div className="flex gap-2">
                        <Textarea
                            placeholder="Type your doubt here..."
                            value={doubt}
                            onChange={(e) => setDoubt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSolveDoubt(); }}}
                            disabled={isLoading}
                        />
                        <Button onClick={handleSolveDoubt} disabled={isLoading || !doubt.trim()}>
                            {isLoading ? <Loader className="animate-spin"/> : <Wand2 />}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
