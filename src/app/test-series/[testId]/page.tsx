
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, AlertTriangle, ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function TakeTestPage() {
    const { testId } = useParams();
    const firestore = useFirestore();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [isFinished, setIsFinished] = useState(false);

    const testRef = useMemoFirebase(() => firestore && testId ? doc(firestore, 'tests', testId as string) : null, [firestore, testId]);
    const { data: testData, isLoading } = useDoc(testRef);

    const questions = useMemo(() => testData?.questions || [], [testData]);
    const currentQuestion = questions[currentQuestionIndex];
    
    const score = useMemo(() => {
        if (!isFinished) return 0;
        return questions.reduce((total, question, index) => {
            return selectedAnswers[index] === question.answer ? total + 1 : total;
        }, 0);
    }, [isFinished, questions, selectedAnswers]);

    const handleAnswerSelect = (value: string) => {
        setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: value }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };
    
    const handleSubmit = () => {
        setIsFinished(true);
    }

    if (isLoading) {
        return <div className="fixed inset-0 bg-background flex items-center justify-center"><Loader className="animate-spin" /></div>;
    }

    if (!testData) {
        return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-4">
                <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-2xl font-bold">Test Not Found</h2>
                <p className="text-muted-foreground">The test you are looking for does not exist.</p>
                <Button asChild className="mt-6">
                    <Link href="/test-series">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Test Series
                    </Link>
                </Button>
            </div>
        );
    }
    
    if (isFinished) {
        return (
             <div className="container mx-auto p-4 max-w-2xl">
                 <Card>
                     <CardHeader className="text-center">
                        <CardTitle>Test Finished!</CardTitle>
                        <CardDescription>You have completed the test: {testData.name}</CardDescription>
                     </CardHeader>
                     <CardContent className="space-y-6">
                        <div className="text-center space-y-2">
                           <p className="text-muted-foreground">Your Score</p>
                           <p className="text-6xl font-bold">{score} / {questions.length}</p>
                           <p className="text-2xl font-semibold">{((score / questions.length) * 100).toFixed(2)}%</p>
                        </div>

                        <div className="space-y-4">
                           <h3 className="font-bold">Review Your Answers</h3>
                           {questions.map((q, index) => (
                               <Card key={index} className={selectedAnswers[index] === q.answer ? 'border-green-500' : 'border-red-500'}>
                                   <CardContent className="p-4 space-y-2">
                                       <p className="font-semibold">{index + 1}. {q.question}</p>
                                       <p className="text-sm">Your answer: <span className="font-medium">{selectedAnswers[index] || "Not Answered"}</span></p>
                                       <p className="text-sm text-green-600">Correct answer: <span className="font-medium">{q.answer}</span></p>
                                   </CardContent>
                               </Card>
                           ))}
                        </div>
                        
                        <Button asChild className="w-full"><Link href="/test-series">Finish Review</Link></Button>
                     </CardContent>
                 </Card>
             </div>
        )
    }

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>{testData.name}</CardTitle>
                    <CardDescription>{testData.description}</CardDescription>
                    <div className="pt-2">
                        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
                        <p className="text-xs text-muted-foreground mt-1 text-center">Question {currentQuestionIndex + 1} of {questions.length}</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                   {currentQuestion && (
                        <div>
                            <p className="font-bold text-lg mb-4">{currentQuestionIndex + 1}. {currentQuestion.question}</p>
                             <RadioGroup value={selectedAnswers[currentQuestionIndex]} onValueChange={handleAnswerSelect} className="space-y-2">
                                {currentQuestion.options.map((option, i) => (
                                    <Label key={i} htmlFor={`q${currentQuestionIndex}-o${i}`} className="flex items-center gap-4 p-4 border rounded-md cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground">
                                        <RadioGroupItem value={option} id={`q${currentQuestionIndex}-o${i}`} />
                                        {option}
                                    </Label>
                                ))}
                            </RadioGroup>
                        </div>
                   )}
                </CardContent>
                <CardContent className="flex justify-between">
                    <Button variant="outline" onClick={handlePrev} disabled={currentQuestionIndex === 0}>Previous</Button>
                    {currentQuestionIndex === questions.length - 1 ? (
                        <Button variant="success" onClick={handleSubmit}>Submit Test</Button>
                    ) : (
                        <Button onClick={handleNext}>Next</Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
