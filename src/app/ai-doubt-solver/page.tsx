'use client';
import { useState, useRef } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Wand2, User, Bot, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { solveDoubt } from '@/ai/flows/doubt-solver-flow';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';
import { FirebaseError } from 'firebase/app';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function AiDoubtSolverPage() {
    const { user } = useUser();
    const { toast } = useToast();
    
    const [doubt, setDoubt] = useState('');
    const [language, setLanguage] = useState<'english' | 'hindi'>('hindi');
    const [answer, setAnswer] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);


    const handleSolveDoubt = async () => {
        if (!doubt.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a doubt.' });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to ask a doubt.' });
            return;
        }

        setIsLoading(true);
        setAnswer(null);
        
        try {
            const response = await solveDoubt({
                doubt,
                userId: user.uid,
                userName: user.displayName || 'Student',
                language,
            });
            setAnswer(response.answer);
        } catch (error) {
            console.error("AI Doubt Solver error:", error);
            setAnswer("Sorry, I couldn't process your request right now. Please try again later.");
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
                        Quickly Study Doubt Solver
                    </CardTitle>
                    <CardDescription>
                        Ask any question by typing. Our AI will help you out.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                     <div className="space-y-2">
                        <Label>Language</Label>
                        <RadioGroup defaultValue="hindi" value={language} onValueChange={(val: 'english' | 'hindi') => setLanguage(val)} className="flex gap-4">
                             <Label htmlFor="lang-en" className="flex items-center gap-2 p-2 border rounded-md cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground flex-1 justify-center">
                                <RadioGroupItem value="english" id="lang-en" />
                                English
                            </Label>
                             <Label htmlFor="lang-hi" className="flex items-center gap-2 p-2 border rounded-md cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground flex-1 justify-center">
                                <RadioGroupItem value="hindi" id="lang-hi" />
                                Hindi
                            </Label>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="doubt-textarea">Your Question</Label>
                        <Textarea
                            id="doubt-textarea"
                            placeholder="Type your doubt here..."
                            value={doubt}
                            onChange={(e) => setDoubt(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    
                    <Button onClick={handleSolveDoubt} disabled={isLoading || !doubt.trim()}>
                        {isLoading ? <Loader className="animate-spin"/> : <Wand2 className="mr-2"/>}
                        Get Answer
                    </Button>
                </CardContent>

                {(isLoading || answer) && (
                    <CardContent className="border-t pt-4">
                         {isLoading && (
                            <div className="flex items-center gap-3">
                                <Bot size={20} className="text-primary"/>
                                <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                                    <Loader className="animate-spin h-4 w-4"/>
                                    <p className="text-sm text-muted-foreground">Thinking...</p>
                                </div>
                            </div>
                        )}
                        {answer && !isLoading && (
                             <div className="flex items-start gap-3">
                                <Bot size={20} className="text-primary shrink-0 mt-1"/>
                                <div className="p-3 rounded-lg bg-muted flex-1">
                                    <p className="text-sm whitespace-pre-wrap">{answer}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
