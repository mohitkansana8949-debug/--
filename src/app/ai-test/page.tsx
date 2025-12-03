
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader, Wand2, ArrowLeft, Award, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateTestFlow, type GenerateTestInput } from '@/ai/flows/generate-test-flow';
import { Progress } from '@/components/ui/progress';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

type TestQuestion = {
  question: string;
  options: string[];
  answer: string;
};

type GeneratedTest = {
  questions: TestQuestion[];
  duration: number; // in minutes
  language: 'hindi' | 'english';
};

export default function AiTestPage() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();
    
    const [step, setStep] = useState<'config' | 'generating' | 'taking' | 'finished'>('config');
    const [config, setConfig] = useState<Omit<GenerateTestInput, 'userId'>>({
        topic: '',
        numQuestions: 5,
        language: 'hindi',
        duration: 10,
    });
    const [generatedTest, setGeneratedTest] = useState<GeneratedTest | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);

     useEffect(() => {
        if (step !== 'taking' || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [step, timeLeft]);


    const handleGenerateTest = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        if (!config.topic.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a topic.' });
            return;
        }

        setStep('generating');
        try {
            const result = await generateTestFlow({ ...config, userId: user.uid });
            setGeneratedTest(result);
            setTimeLeft(result.duration * 60);
            setStep('taking');
        } catch (e) {
            console.error("AI Test Generation Error:", e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate the test. Please try again.' });
            setStep('config');
        }
    };

    const handleAnswerSelect = (value: string) => {
        setSelectedAnswers(prev => ({ ...prev, [currentQuestionIndex]: value }));
    };

    const handleNext = () => {
        if (generatedTest && currentQuestionIndex < generatedTest.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleSubmit = async () => {
        if (!generatedTest) return;
        
        const finalScore = generatedTest.questions.reduce((total, question, index) => {
            return selectedAnswers[index] === question.answer ? total + 1 : total;
        }, 0);
        
        setScore(finalScore);
        setStep('finished');

        // Optional: Save certificate if score is good
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    const currentQuestion = generatedTest?.questions[currentQuestionIndex];

    return (
        <div className="container mx-auto p-4 max-w-2xl h-full flex flex-col">
            {step === 'config' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wand2 className="text-primary"/> AI Test Generator</CardTitle>
                        <CardDescription>Create a custom test on any topic.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="topic">Topic</Label>
                            <Input id="topic" value={config.topic} onChange={e => setConfig(c => ({ ...c, topic: e.target.value }))} placeholder="e.g., Indian History" />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="numQuestions">Number of Questions</Label>
                                <Input id="numQuestions" type="number" value={config.numQuestions} onChange={e => setConfig(c => ({ ...c, numQuestions: Number(e.target.value) }))} min="1" max="20" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (Minutes)</Label>
                                <Input id="duration" type="number" value={config.duration} onChange={e => setConfig(c => ({ ...c, duration: Number(e.target.value) }))} min="1" max="60" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Language</Label>
                            <RadioGroup value={config.language} onValueChange={(val: 'hindi' | 'english') => setConfig(c => ({...c, language: val}))} className="flex gap-4">
                                <Label htmlFor="lang-hi" className="flex-1 border rounded-md p-3 flex items-center gap-2 cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"><RadioGroupItem value="hindi" id="lang-hi" /> Hindi</Label>
                                <Label htmlFor="lang-en" className="flex-1 border rounded-md p-3 flex items-center gap-2 cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"><RadioGroupItem value="english" id="lang-en" /> English</Label>
                            </RadioGroup>
                        </div>
                        <Button onClick={handleGenerateTest} className="w-full">Generate Test</Button>
                    </CardContent>
                </Card>
            )}

            {step === 'generating' && (
                <Card className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <Loader className="h-12 w-12 animate-spin text-primary mb-4" />
                    <h2 className="text-xl font-semibold">Generating Your Test...</h2>
                    <p className="text-muted-foreground">The AI is crafting your questions. Please wait a moment.</p>
                </Card>
            )}

            {step === 'taking' && generatedTest && currentQuestion && (
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>AI Test: {config.topic}</span>
                            <span className="flex items-center text-base font-mono bg-destructive text-destructive-foreground px-2 py-1 rounded-md"><Clock className="mr-2 h-4 w-4" />{formatTime(timeLeft)}</span>
                        </CardTitle>
                        <div className="pt-2">
                            <Progress value={((currentQuestionIndex + 1) / generatedTest.questions.length) * 100} />
                            <p className="text-xs text-muted-foreground mt-1 text-center">Question {currentQuestionIndex + 1} of {generatedTest.questions.length}</p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                    </CardContent>
                    <CardContent className="flex justify-between">
                         <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => p - 1)} disabled={currentQuestionIndex === 0}>Previous</Button>
                        {currentQuestionIndex === generatedTest.questions.length - 1 ? (
                            <Button variant="success" onClick={handleSubmit}>Submit Test</Button>
                        ) : (
                            <Button onClick={handleNext}>Next</Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {step === 'finished' && generatedTest && (
                 <Card>
                     <CardHeader className="text-center">
                        <CardTitle>Test Finished!</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-6 text-center">
                        <div className="space-y-2">
                           <p className="text-muted-foreground">Your Score</p>
                           <p className="text-6xl font-bold">{score} / {generatedTest.questions.length}</p>
                        </div>
                        <Button onClick={() => setStep('config')}>Take Another Test</Button>
                     </CardContent>
                 </Card>
            )}

        </div>
    );
}
