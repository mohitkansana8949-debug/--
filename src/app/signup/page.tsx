
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Loader } from 'lucide-react';
import { doc, getDoc, writeBatch, collection, runTransaction } from 'firebase/firestore';

const signupSchema = z.object({
  name: z.string().min(2, 'कम से कम 2 अक्षर का नाम होना चाहिए।'),
  email: z.string().email('कृपया एक मान्य ईमेल पता दर्ज करें।'),
  password: z.string().min(6, 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'),
  referralCode: z.string().optional(),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  const refCode = searchParams.get('ref');

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      referralCode: refCode || '',
    },
  });

  useEffect(() => {
    const fetchReferrerName = async () => {
        if (refCode && firestore) {
            try {
                const userDoc = await getDoc(doc(firestore, 'users', refCode));
                if (userDoc.exists()) {
                    setReferrerName(userDoc.data().name);
                }
            } catch (error) {
                console.error("Could not fetch referrer name:", error);
            }
        }
    };
    fetchReferrerName();
  }, [refCode, firestore]);

  const onSubmit = async (data: SignupFormValues) => {
    if (!auth || !firestore) return;
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

      // Handle referral and initial points logic in a transaction
      await runTransaction(firestore, async (transaction) => {
        const referredId = userCredential.user.uid;
        const newUserPointsRef = doc(firestore, 'referralPoints', referredId);
        
        // Always read first
        let referrerPointsRef;
        let referrerPointsDoc;
        if (data.referralCode) {
            const referrerId = data.referralCode;
            referrerPointsRef = doc(firestore, 'referralPoints', referrerId);
            referrerPointsDoc = await transaction.get(referrerPointsRef);
        }
        
        // Now perform all writes
        transaction.set(newUserPointsRef, {
          userId: referredId,
          points: 5,
        });
        
        if (data.referralCode && referrerPointsRef && referrerPointsDoc) {
            const referrerId = data.referralCode;
            
            const referralRef = doc(collection(firestore, 'referrals'));
            transaction.set(referralRef, {
                referrerId: referrerId,
                referredId: referredId,
                referredName: data.name,
                createdAt: new Date(),
            });

            if (referrerPointsDoc.exists()) {
                const currentPoints = referrerPointsDoc.data().points || 0;
                transaction.update(referrerPointsRef, {
                    points: currentPoints + 10,
                });
            } else {
                transaction.set(referrerPointsRef, {
                    userId: referrerId,
                    points: 10,
                });
            }
        }
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
            'यह ईमेल पहले से उपयोग में है। कृपया दूसरा प्रयास करें या लॉग इन करें।';
        } else {
          description = 'साइन अप करने में विफल। कृपया अपनी जानकारी जांचें।';
        }
      }
      console.error("Signup Error: ", error);
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
          {referrerName && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md text-center text-sm text-blue-800 dark:text-blue-200">
                  You have been referred by <strong>{referrerName}</strong>. You'll get 5 bonus points!
              </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>पूरा नाम</FormLabel>
                    <FormControl><Input placeholder="जैसे, मोहित कुमार" {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>ईमेल</FormLabel>
                    <FormControl><Input type="email" placeholder="your@email.com" {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>पासवर्ड</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field}/></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
               {refCode && (
                  <FormField control={form.control} name="referralCode" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Referral Code</FormLabel>
                          <FormControl><Input {...field} disabled /></FormControl>
                          <FormMessage />
                      </FormItem>
                  )}/>
              )}
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
