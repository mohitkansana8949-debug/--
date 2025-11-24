"use client";

import { useState, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateFlashcardsFromText } from '@/ai/flows/generate-flashcards-from-text';
import { useDecks } from '@/hooks/use-decks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const flashcardSchema = z.object({
    question: z.string().min(1, 'Question cannot be empty.'),
    answer: z.string().min(1, 'Answer cannot be empty.'),
});

const deckSchema = z.object({
    title: z.string().min(1, 'Deck title is required.'),
    description: z.string(),
    sourceText: z.string().min(50, 'Please provide at least 50 characters of text to generate flashcards from.'),
    flashcards: z.array(flashcardSchema).min(1, 'At least one flashcard is required.'),
});

type DeckFormData = z.infer<typeof deckSchema>;

export function FlashcardGenerator() {
    const router = useRouter();
    const { addDeck } = useDecks();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<DeckFormData>({
        resolver: zodResolver(deckSchema),
        defaultValues: {
            title: '',
            description: '',
            sourceText: '',
            flashcards: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'flashcards',
    });

    const handleGenerate = async () => {
        const sourceText = form.getValues('sourceText');
        if (sourceText.length < 50) {
            form.setError('sourceText', { type: 'manual', message: 'Please provide at least 50 characters of text.' });
            return;
        }

        setIsGenerating(true);
        form.setValue('flashcards', []); // Clear existing cards

        try {
            const generatedCards = await generateFlashcardsFromText({ text: sourceText });
            if (generatedCards && generatedCards.length > 0) {
                form.setValue('flashcards', generatedCards as { question: string, answer: string }[]);
                toast({
                    title: "Flashcards Generated!",
                    description: `${generatedCards.length} cards were created. You can now edit and save your deck.`,
                });
            } else {
                throw new Error('No flashcards were generated.');
            }
        } catch (error) {
            console.error('Error generating flashcards:', error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: 'Could not generate flashcards. Please try again or with different text.',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                form.setValue('sourceText', text);
            };
            reader.readAsText(file);
        }
    };

    const onSubmit = (data: DeckFormData) => {
        const { title, description, flashcards } = data;
        const newDeck = addDeck({
            title,
            description,
            flashcards: flashcards.map(fc => ({ ...fc, id: `fc-${Date.now()}-${Math.random()}` })),
        });
        toast({
            title: 'Deck Saved!',
            description: `The "${title}" deck has been added to your collection.`,
        });
        router.push(`/decks/${newDeck.id}`);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Provide Source</CardTitle>
                                <CardDescription>Paste text or upload a file.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="sourceText"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Source Text</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    placeholder="Paste your notes, an article, or any text here..."
                                                    rows={15}
                                                    className="max-h-[50vh] min-h-[200px]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="relative">
                                  <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                  </div>
                                  <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                                  </div>
                                </div>
                                <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload a .txt file
                                </Button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".txt"
                                    className="hidden"
                                />
                            </CardContent>
                            <CardFooter>
                                <Button type="button" onClick={handleGenerate} disabled={isGenerating} className="w-full">
                                    {isGenerating ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="mr-2 h-4 w-4" />
                                    )}
                                    Generate with AI
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>2. Review & Save Deck</CardTitle>
                                <CardDescription>Edit generated cards and give your deck a title.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Deck Title</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g., 'Chapter 5: Cell Biology'" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="A short description of this deck" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                {fields.length > 0 ? (
                                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 -m-1">
                                        {fields.map((field, index) => (
                                            <Card key={field.id} className="bg-background relative">
                                                <CardContent className="p-4 grid sm:grid-cols-2 gap-4 items-start">
                                                    <FormField
                                                        control={form.control}
                                                        name={`flashcards.${index}.question`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Question {index + 1}</FormLabel>
                                                                <FormControl><Textarea {...field} rows={3} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                     <FormField
                                                        control={form.control}
                                                        name={`flashcards.${index}.answer`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Answer</FormLabel>
                                                                <FormControl><Textarea {...field} rows={3} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                                 <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive h-7 w-7">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Alert>
                                        <Sparkles className="h-4 w-4" />
                                        <AlertTitle>Your flashcards will appear here!</AlertTitle>
                                        <AlertDescription>
                                            After generating flashcards from your text, you can edit them here before saving your new deck.
                                        </AlertDescription>
                                    </Alert>
                                )}

                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button type="submit" disabled={isGenerating || fields.length === 0}>Save Deck</Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </form>
        </Form>
    );
}
