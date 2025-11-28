
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Loader } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('कृपया एक मान्य ईमेल पता दर्ज करें।'),
  password: z.string().min(6, 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'लॉगिन सफल',
        description: 'आप सफलतापूर्वक लॉगिन हो गए हैं।',
      });
      router.push('/');
    } catch (error) {
      console.error(error);
      let description = 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।';
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          description = 'अमान्य ईमेल या पासवर्ड। कृपया पुनः प्रयास करें।';
        } else {
          description = error.message;
        }
      }
      toast({
        variant: 'destructive',
        title: 'लॉगिन विफल',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>आपका स्वागत है!</CardTitle>
          <CardDescription>
            अपने अकाउंट में 접속 करने के लिए अपनी जानकारी दर्ज करें।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ईमेल</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>पासवर्ड</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin"/>लॉगिन हो रहा है...</> : 'लॉगिन करें'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            क्या आपका कोई खाता नहीं है?{' '}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/signup">साइन अप करें</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
