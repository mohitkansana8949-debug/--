"use client";

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDecks } from '@/hooks/use-decks';
import { Button } from '../ui/button';
import { ArrowLeft, ArrowRight, Check, Lightbulb, RotateCcw, X } from 'lucide-react';
import { Progress } from '../ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type QuizStatus = 'unanswered' | 'correct' | 'incorrect';

interface QuizCard {
    question: string;
    answer: string;
    userAnswer: string;
    status: QuizStatus;
}

export function QuizMode() {
    const router = useRouter();
    const params = useParams();
    const deckId = params.deckId as string;
    const { getDeckById, isLoaded } = useDecks();
    
    const [deck, setDeck] = useState(() => getDeckById(deckId));
    const [quizCards, setQuizCards] = useState<QuizCard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [showHint, setShowHint] = useState(false);

    const initializeQuiz = () => {
      if (deck) {
          const shuffled = [...deck.flashcards].sort(() => Math.random() - 0.5);
          setQuizCards(shuffled.map(fc => ({ ...fc, userAnswer: '', status: 'unanswered' })));
          setCurrentIndex(0);
          setIsFinished(false);
          setShowHint(false);
      }
    }

    useEffect(() => {
        if (isLoaded) {
            const loadedDeck = getDeckById(deckId);
            setDeck(loadedDeck);
        }
    }, [isLoaded, deckId, getDeckById]);
    
    useEffect(() => {
        initializeQuiz();
    }, [deck]);

    const currentQuizCard = quizCards[currentIndex];

    const handleAnswerSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const userAnswer = (e.currentTarget.elements.namedItem('answer') as HTMLInputElement).value;
        const isCorrect = userAnswer.trim().toLowerCase() === currentQuizCard.answer.trim().toLowerCase();
        
        const updatedCards = [...quizCards];
        updatedCards[currentIndex] = {
            ...currentQuizCard,
            userAnswer,
            status: isCorrect ? 'correct' : 'incorrect'
        };
        setQuizCards(updatedCards);
    };
    
    const goToNext = () => {
        setShowHint(false);
        if (currentIndex < quizCards.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };
    
    const score = useMemo(() => quizCards.filter(c => c.status === 'correct').length, [quizCards]);
    const progress = useMemo(() => (currentIndex / quizCards.length) * 100, [currentIndex, quizCards]);

    if (!isLoaded) return <div className="flex items-center justify-center h-full"><p>Loading quiz...</p></div>;
    if (!deck || quizCards.length === 0) {
      return (
        <div className="text-center">
            <p>This deck has no flashcards to quiz on.</p>
            <Button onClick={() => router.push(`/decks/${deckId}`)} className="mt-4">Go Back</Button>
        </div>
      );
    }
    
    if (isFinished) {
        return (
            <Card className="max-w-2xl mx-auto text-center p-8">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Quiz Complete!</CardTitle>
                    <CardDescription>You scored {score} out of {quizCards.length}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={(score / quizCards.length) * 100} className="mb-6" />
                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto p-2 text-left">
                        {quizCards.map((card, i) => (
                            <div key={i} className={cn("p-3 rounded-md", card.status === 'correct' ? 'bg-success-bg' : 'bg-error-bg')}>
                                <p className="font-semibold">{i+1}. {card.question}</p>
                                <p className={cn("text-sm", card.status === 'correct' ? 'text-success-fg' : 'text-error-fg')}>Your answer: {card.userAnswer || "No answer"}</p>
                                {card.status === 'incorrect' && <p className="text-sm text-success-fg">Correct answer: {card.answer}</p>}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Button onClick={initializeQuiz}><RotateCcw className="mr-2 h-4 w-4" /> Take Again</Button>
                        <Button variant="outline" onClick={() => router.push(`/decks/${deckId}`)}>Back to Deck</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!currentQuizCard) {
      return <div className="flex items-center justify-center h-full"><p>Loading questions...</p></div>
    }

    return (
        <div className="max-w-2xl mx-auto flex flex-col h-full">
            <Button variant="ghost" onClick={() => router.push(`/decks/${deckId}`)} className="mb-4 self-start">
                <ArrowLeft className="mr-2 h-4 w-4" /> Exit Quiz
             </Button>

            <Card className="flex-grow flex flex-col">
                <CardHeader>
                    <CardTitle>Question {currentIndex + 1}</CardTitle>
                    <CardDescription className="text-xl md:text-2xl font-semibold pt-2 min-h-[6rem]">{currentQuizCard.question}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center">
                    {currentQuizCard.status === 'unanswered' ? (
                        <form onSubmit={handleAnswerSubmit} className="space-y-4">
                            <Input name="answer" placeholder="Type your answer here..." autoComplete="off" autoFocus />
                            <div className="flex justify-between items-center">
                                <Button type="submit">Submit</Button>
                                <Button type="button" variant="ghost" onClick={() => setShowHint(true)}>
                                    <Lightbulb className="mr-2 h-4 w-4" /> Show Hint
                                </Button>
                            </div>
                           {showHint && <Alert><AlertDescription>The answer starts with: {currentQuizCard.answer.charAt(0)}</AlertDescription></Alert>}
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div className={cn(
                                "p-4 rounded-md flex items-center gap-3",
                                currentQuizCard.status === 'correct' ? 'bg-success-bg text-success-fg' : 'bg-error-bg text-error-fg'
                            )}>
                                {currentQuizCard.status === 'correct' ? <Check className="h-5 w-5"/> : <X className="h-5 w-5"/>}
                                <p>Your answer: <strong>{currentQuizCard.userAnswer}</strong></p>
                            </div>
                            {currentQuizCard.status === 'incorrect' && (
                                <Alert className="bg-success-bg border-none text-success-fg">
                                    <AlertTitle className="text-success-fg">Correct Answer</AlertTitle>
                                    <AlertDescription>{currentQuizCard.answer}</AlertDescription>
                                </Alert>
                            )}
                            <Button onClick={goToNext} className="w-full" autoFocus>
                                {currentIndex === quizCards.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <div className="mt-auto pt-4">
                <Progress value={progress} className="w-full" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Question {currentIndex + 1} of {quizCards.length}</span>
                    <span>Score: {score}</span>
                </div>
            </div>
        </div>
    );
}
