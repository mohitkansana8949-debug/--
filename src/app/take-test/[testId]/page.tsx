
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useMemoFirebase, useFirestore, useUser } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Loader, AlertTriangle, ArrowLeft, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function TakeTestPage() {
    const { testId } = useParams();
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const testRef = useMemoFirebase(() => firestore && testId ? doc(firestore, 'tests', testId as string) : null, [firestore, testId]);
    const { data: testData, isLoading } = useDoc(testRef);

    const questions = useMemo(() => testData?.questions || [], [testData]);
    const currentQuestion = questions[currentQuestionIndex];
    
    const score = useMemo(() => {
        if (!isFinished) return 0;
        return questions.reduce((total: number, question: any, index: number) => {
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
    
    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setIsFinished(true); // Show results immediately

        const finalScore = questions.reduce((total: number, question: any, index: number) => {
            return selectedAnswers[index] === question.answer ? total + 1 : total;
        }, 0);
        const percentage = (finalScore / questions.length) * 100;

        if (user && firestore && testData && percentage >= 50) {
            try {
                const certificatesRef = collection(firestore, `users/${user.uid}/certificates`);
                await addDoc(certificatesRef, {
                    userId: user.uid,
                    userName: user.displayName,
                    itemName: testData.name,
                    itemType: 'test',
                    completionDate: serverTimestamp(),
                    grade: percentage
                });
                toast({
                    title: "Congratulations!",
                    description: `You've earned a certificate for completing ${testData.name}.`,
                });
            } catch (error) {
                console.error("Failed to create certificate:", error);
                toast({
                    variant: "destructive",
                    title: "Certificate Error",
                    description: "Could not save your certificate. Please contact support.",
                });
            }
        }
        setIsSubmitting(false);
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
                <Button asChild className="mt-6" onClick={() => router.back()}>
                   <button>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                   </button>
                </Button>
            </div>
        );
    }
    
    if (isFinished) {
        const percentage = (score / questions.length) * 100;
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
                           <p className="text-2xl font-semibold">{percentage.toFixed(2)}%</p>
                           {percentage >= 50 && (
                               <div className="flex justify-center items-center gap-2 text-green-500 pt-2">
                                   <Award className="h-6 w-6" />
                                   <span className="font-semibold">Certificate Earned!</span>
                               </div>
                           )}
                        </div>

                        <div className="space-y-4">
                           <h3 className="font-bold">Review Your Answers</h3>
                           {questions.map((q: any, index: number) => (
                               <Card key={index} className={selectedAnswers[index] === q.answer ? 'border-green-500' : 'border-red-500'}>
                                   <CardContent className="p-4 space-y-2">
                                       <p className="font-semibold">{index + 1}. {q.question}</p>
                                       <p className="text-sm">Your answer: <span className="font-medium">{selectedAnswers[index] || "Not Answered"}</span></p>
                                       <p className="text-sm text-green-600">Correct answer: <span className="font-medium">{q.answer}</span></p>
                                   </CardContent>
                               </Card>
                           ))}
                        </div>
                        
                        <Button className="w-full" onClick={() => router.back()}>Finish Review</Button>
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
                                {currentQuestion.options.map((option: string, i: number) => (
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
                        <Button variant="success" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? <Loader className="animate-spin mr-2" /> : null}
                            Submit Test
                        </Button>
                    ) : (
                        <Button onClick={handleNext}>Next</Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
