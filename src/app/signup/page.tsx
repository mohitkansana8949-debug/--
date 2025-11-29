
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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Loader } from 'lucide-react';

const signupSchema = z.object({
  name: z.string().min(2, 'कम से कम 2 अक्षर का नाम होना चाहिए।'),
  email: z.string().email('कृपया एक मान्य ईमेल पता दर्ज करें।'),
  password: z.string().min(6, 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      await updateProfile(userCredential.user, {
        displayName: data.name,
      });

      toast({
        title: 'अकाउंट बन गया',
        description: "आपका सफलतापूर्वक साइन अप हो गया है!",
      });
      // AuthGate will redirect to /complete-profile
    } catch (error) {
      let description = 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।';
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
          description =
            'यह ईमेल पहले से उपयोग में है। कृपया दूसरा प्रयास करें।';
        } else {
          description = 'साइन अप करने में विफल। कृपया अपनी जानकारी जांचें।';
        }
      }
      toast({
        variant: 'destructive',
        title: 'साइन अप विफल',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-4">
       <div className="text-center mb-8">
         <h1 className="text-2xl font-semibold tracking-tight">Welcome to QuklyStudy</h1>
         <p className="text-sm text-muted-foreground">The quickest way to study.</p>
       </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>अकाउंट बनाएं</CardTitle>
          <CardDescription>
            अपनी सीखने की यात्रा शुरू करने के लिए Quickly Study से जुड़ें।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>पूरा नाम</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="जैसे, मोहित कुमार"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                {isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin"/>अकाउंट बन रहा है...</> : 'अकाउंट बनाएं'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            क्या आपका पहले से एक खाता मौजूद है?{' '}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/login">साइन इन करें</Link>
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
