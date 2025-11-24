"use client";

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDecks } from '@/hooks/use-decks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Brain, BookCopy, FileQuestion } from 'lucide-react';
import { format } from 'date-fns';

export default function DeckDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const deckId = params.deckId as string;
    const { getDeckById, isLoaded } = useDecks();

    const deck = getDeckById(deckId);

    if (!isLoaded) {
        return (
            <div className="space-y-4 max-w-4xl mx-auto">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    if (!deck) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold">Deck not found</h2>
                <p className="text-muted-foreground">The deck you are looking for does not exist.</p>
                <Button onClick={() => router.push('/decks')} className="mt-4">
                    Back to Decks
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
             <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
             </Button>

             <Card className="mb-8 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-4xl font-bold">{deck.title}</CardTitle>
                    <CardDescription className="text-lg pt-2">{deck.description || 'No description provided.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                        <BookCopy className="mr-2 h-4 w-4" />
                        <span>{deck.flashcards.length} cards</span>
                        <span className="mx-2">•</span>
                        <span>Created on {format(new Date(deck.createdAt), "MMMM d, yyyy")}</span>
                    </div>
                </CardContent>
             </Card>

            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-4">Choose Your Study Mode</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button size="lg" asChild className="w-full sm:w-auto">
                        <Link href={`/decks/${deck.id}/study`}>
                            <Brain className="mr-2 h-5 w-5" />
                            Study Mode
                        </Link>
                    </Button>
                    <Button size="lg" variant="secondary" asChild className="w-full sm:w-auto">
                         <Link href={`/decks/${deck.id}/quiz`}>
                            <FileQuestion className="mr-2 h-5 w-5" />
                            Quiz Mode
                        </Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Flashcards in this Deck</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {deck.flashcards.map((card) => (
                            <li key={card.id} className="p-4 rounded-md bg-background flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <p className="font-medium flex-1">{card.question}</p>
                                <p className="text-muted-foreground flex-1">{card.answer}</p>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
