
'use client';
import { useState, useRef } from 'react';
import { useUser, useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader, Wand2, User, Bot, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { solveDoubt } from '@/ai/flows/doubt-solver-flow';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Image from 'next/image';

type Message = {
    sender: 'user' | 'bot';
    text: string;
    image?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function AiDoubtSolverPage() {
    const { user } = useUser();
    const { firebaseApp } = useFirebase();
    const { toast } = useToast();
    
    const [doubt, setDoubt] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [language, setLanguage] = useState<'english' | 'hindi'>('hindi');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: 'destructive',
                    title: 'File Too Large',
                    description: 'Please upload an image smaller than 5 MB.',
                });
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSolveDoubt = async () => {
        if (!doubt.trim() && !imageFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please enter a doubt or upload an image.' });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to ask a doubt.' });
            return;
        }

        const userMessage: Message = { sender: 'user', text: doubt, image: imagePreview || undefined };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        setDoubt('');
        setImageFile(null);
        setImagePreview(null);

        let imageUrl: string | null = null;
        if (imageFile && firebaseApp) {
            try {
                const storage = getStorage(firebaseApp);
                const storageRef = ref(storage, `doubts/${user.uid}/${Date.now()}-${imageFile.name}`);
                const uploadResult = await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(uploadResult.ref);
            } catch (error) {
                 console.error("Image upload error:", error);
                 toast({ variant: 'destructive', title: 'Upload Error', description: 'Failed to upload image.' });
                 const errorMessage: Message = { sender: 'bot', text: "Sorry, I couldn't upload your image. Please try again." };
                 setMessages(prev => [...prev, errorMessage]);
                 setIsLoading(false);
                 return;
            }
        }
        
        try {
            const response = await solveDoubt({
                doubt,
                userId: user.uid,
                userName: user.displayName || 'Student',
                language,
                imageUrl,
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
                        Ask any question by typing or uploading an image. Our AI will help you out.
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
                                {message.image && <Image src={message.image} alt="Doubt image" width={200} height={200} className="rounded-md mb-2" />}
                                {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
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
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <Label className="mb-2 block">Language</Label>
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
                                <Label>Image (Optional)</Label>
                                {imagePreview ? (
                                    <div className="relative w-24 h-24">
                                        <Image src={imagePreview} alt="Image preview" layout="fill" className="rounded-md object-cover" />
                                        <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => {setImageFile(null); setImagePreview(null)}}>
                                            <X size={14} />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <ImageIcon className="mr-2" /> Upload Image
                                    </Button>
                                )}
                                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Type your doubt here..."
                                value={doubt}
                                onChange={(e) => setDoubt(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSolveDoubt(); }}}
                                disabled={isLoading}
                            />
                            <Button onClick={handleSolveDoubt} disabled={isLoading || (!doubt.trim() && !imageFile)}>
                                {isLoading ? <Loader className="animate-spin"/> : <Wand2 />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
