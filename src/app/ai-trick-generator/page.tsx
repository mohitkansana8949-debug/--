
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Wand2, Bot, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateTrick } from '@/ai/flows/trick-generator-flow';
import { Label } from '@/components/ui/label';

export default function AiTrickGeneratorPage() {
    const { toast } = useToast();
    
    const [topic, setTopic] = useState('');
    const [trick, setTrick] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateTrick = async () => {
        if (!topic.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a topic.' });
            return;
        }

        setIsLoading(true);
        setTrick(null);
        
        try {
            const response = await generateTrick({ topic });
            setTrick(response.trick);
        } catch (error) {
            console.error("AI Trick Generator error:", error);
            setTrick("Sorry, I couldn't generate a trick for this topic right now. Please try again later.");
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
                        <BrainCircuit className="text-primary h-6 w-6"/>
                        AI Trick Generator
                    </CardTitle>
                    <CardDescription>
                        Enter any topic to generate a memorable trick or mnemonic.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic-textarea">Topic to remember</Label>
                        <Textarea
                            id="topic-textarea"
                            placeholder="e.g., राजस्थान के जिले, types of vitamins, planets in order"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    
                    <Button onClick={handleGenerateTrick} disabled={isLoading || !topic.trim()}>
                        {isLoading ? <Loader className="animate-spin"/> : <Wand2 className="mr-2"/>}
                        Generate Trick
                    </Button>
                </CardContent>

                {(isLoading || trick) && (
                    <CardContent className="border-t pt-4">
                         {isLoading && (
                            <div className="flex items-center gap-3">
                                <Bot size={20} className="text-primary"/>
                                <div className="p-3 rounded-lg bg-muted flex items-center gap-2">
                                    <Loader className="animate-spin h-4 w-4"/>
                                    <p className="text-sm text-muted-foreground">Generating trick...</p>
                                </div>
                            </div>
                        )}
                        {trick && !isLoading && (
                             <div className="flex items-start gap-3">
                                <Bot size={20} className="text-primary shrink-0 mt-1"/>
                                <div className="p-3 rounded-lg bg-muted flex-1">
                                    <p className="text-sm whitespace-pre-wrap">{trick}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
