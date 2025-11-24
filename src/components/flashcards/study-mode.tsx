"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDecks } from '@/hooks/use-decks';
import { FlashcardView } from './flashcard-view';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight, Check, RotateCcw, X } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Card, CardContent } from '../ui/card';

export function StudyMode() {
    const router = useRouter();
    const params = useParams();
    const deckId = params.deckId as string;
    const { getDeckById, updateDeck, isLoaded } = useDecks();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [localDeck, setLocalDeck] = useState(() => getDeckById(deckId));

    useEffect(() => {
        if(isLoaded) {
            setLocalDeck(getDeckById(deckId));
        }
    }, [isLoaded, deckId, getDeckById]);
    
    const flashcards = useMemo(() => localDeck?.flashcards || [], [localDeck]);
    const currentCard = flashcards[currentIndex];
    
    const progress = useMemo(() => {
        if (flashcards.length === 0) return 0;
        return ((currentIndex) / flashcards.length) * 100;
    }, [currentIndex, flashcards.length]);
    
    const learnedCount = useMemo(() => {
        return flashcards.filter(c => c.isLearned).length;
    }, [flashcards]);

    const goToNext = useCallback(() => {
        if (currentIndex <= flashcards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, flashcards.length]);

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleMarkLearned = (isLearned: boolean) => {
        if (localDeck) {
            const updatedFlashcards = [...localDeck.flashcards];
            updatedFlashcards[currentIndex].isLearned = isLearned;
            const updatedDeck = { ...localDeck, flashcards: updatedFlashcards };
            setLocalDeck(updatedDeck);
            updateDeck(deckId, { flashcards: updatedFlashcards });
            goToNext();
        }
    };

    const resetProgress = () => {
        if (localDeck) {
            const resetFlashcards = localDeck.flashcards.map(fc => ({ ...fc, isLearned: false }));
            const updatedDeck = { ...localDeck, flashcards: resetFlashcards };
            setLocalDeck(updatedDeck);
            updateDeck(deckId, { flashcards: resetFlashcards });
            setCurrentIndex(0);
        }
    }

    if (!isLoaded) return <div className="flex items-center justify-center h-full"><p>Loading deck...</p></div>;
    if (!localDeck) return <div className="flex items-center justify-center h-full"><p>Deck not found.</p></div>;
    if (flashcards.length === 0) {
        return (
            <div className="text-center">
                <p>This deck has no flashcards.</p>
                <Button onClick={() => router.push(`/decks/${deckId}`)} className="mt-4">Go Back</Button>
            </div>
        );
    }
    
    if (currentIndex >= flashcards.length) {
        return (
            <Card className="max-w-2xl mx-auto text-center p-8">
                <CardContent>
                    <Check className="w-16 h-16 mx-auto text-success-fg bg-success-bg rounded-full p-2 mb-4" />
                    <h2 className="text-3xl font-bold mb-2">Deck Complete!</h2>
                    <p className="text-muted-foreground mb-6">You've reviewed all the cards. You marked {learnedCount} of {flashcards.length} as learned.</p>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={resetProgress}><RotateCcw className="mr-2 h-4 w-4" /> Study Again</Button>
                        <Button variant="outline" onClick={() => router.push(`/decks/${deckId}`)}>Back to Deck</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="max-w-3xl mx-auto flex flex-col h-full">
             <Button variant="ghost" onClick={() => router.push(`/decks/${deckId}`)} className="mb-4 self-start">
                <ArrowLeft className="mr-2 h-4 w-4" /> Exit Study Mode
             </Button>
            <div className="flex-grow flex flex-col items-center justify-center">
                <div className="w-full aspect-[2/1] sm:aspect-[3/2] max-h-[50vh] mb-6">
                    <FlashcardView 
                        key={currentCard.id}
                        question={currentCard.question}
                        answer={currentCard.answer}
                    />
                </div>
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="lg" onClick={goToPrev} disabled={currentIndex === 0}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="font-semibold text-lg">{currentIndex + 1} / {flashcards.length}</div>
                    <Button variant="outline" size="lg" onClick={goToNext} disabled={currentIndex >= flashcards.length - 1}>
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </div>
                 <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                    <Button variant="destructive" size="lg" className="flex-1" onClick={() => handleMarkLearned(false)}>
                        <X className="mr-2 h-5 w-5" /> Review Again
                    </Button>
                    <Button variant="success" size="lg" className="flex-1" onClick={() => handleMarkLearned(true)}>
                        <Check className="mr-2 h-5 w-5" /> Got It!
                    </Button>
                </div>
            </div>
            <div className="mt-auto pt-4">
                <Progress value={progress} className="w-full" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Progress</span>
                    <span>{learnedCount} / {flashcards.length} learned</span>
                </div>
            </div>
        </div>
    );
}
