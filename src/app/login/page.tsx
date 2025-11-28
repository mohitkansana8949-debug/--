
'use client';
import { useState, useEffect, useRef } from 'react';
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
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Loader } from 'lucide-react';

const phoneSchema = z.object({
  phone: z.string().min(10, 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।').max(10, 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।'),
});
const otpSchema = z.object({
    otp: z.string().min(6, 'कृपया 6 अंकों का OTP दर्ज करें।').max(6, 'कृपया 6 अंकों का OTP दर्ज करें।'),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<OtpFormValues>({
      resolver: zodResolver(otpSchema),
      defaultValues: { otp: '' },
  });
  
  useEffect(() => {
    if (auth && !recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': () => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
    }
  }, [auth]);

  const onPhoneSubmit = async (data: PhoneFormValues) => {
    if (!auth || !recaptchaVerifierRef.current) {
        toast({ variant: "destructive", title: "Authentication Error", description: "प्रमाणीकरण सेवा से कनेक्ट नहीं हो सका।"});
        return;
    }
    setIsLoading(true);
    try {
      const phoneNumber = `+91${data.phone}`;
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      toast({ title: 'OTP भेजा गया', description: `आपके नंबर ${phoneNumber} पर एक OTP भेजा गया है।`});
    } catch (error) {
      console.error(error);
      let description = 'एक अप्रत्याशित त्रुटि हुई।';
      if (error instanceof FirebaseError) {
        description = error.message;
      }
      toast({ variant: 'destructive', title: 'OTP भेजने में विफल', description });
      // Reset reCAPTCHA
      if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.render().then(widgetId => {
              //@ts-ignore
              window.grecaptcha.reset(widgetId);
          });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const onOtpSubmit = async (data: OtpFormValues) => {
    if (!confirmationResult) {
        toast({ variant: "destructive", title: "Error", description: "पहले OTP का अनुरोध करें।"});
        return;
    }
    setIsLoading(true);
    try {
        await confirmationResult.confirm(data.otp);
        toast({ title: 'लॉगिन सफल', description: "आप सफलतापूर्वक लॉगिन हो गए हैं।" });
        router.push('/complete-profile');
    } catch (error) {
        console.error(error);
        let description = 'एक अप्रत्याशित त्रुटि हुई।';
        if (error instanceof FirebaseError) {
             switch (error.code) {
                case 'auth/invalid-verification-code':
                    description = 'अमान्य OTP। कृपया पुनः प्रयास करें।';
                    break;
                case 'auth/code-expired':
                    description = 'OTP समाप्त हो गया है। कृपया एक नया अनुरोध करें।';
                    break;
                default:
                    description = error.message;
            }
        }
        toast({ variant: 'destructive', title: 'लॉगिन विफल', description });
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
          {!confirmationResult ? (
            <Form {...phoneForm}>
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                <FormField control={phoneForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                        <FormLabel>मोबाइल नंबर</FormLabel>
                        <FormControl><Input type="tel" placeholder="98765 43210" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin"/>भेजा जा रहा है...</> : 'OTP भेजें'}
                </Button>
                </form>
            </Form>
          ) : (
            <Form {...otpForm}>
                <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                <FormField control={otpForm.control} name="otp" render={({ field }) => (
                    <FormItem>
                        <FormLabel>OTP दर्ज करें</FormLabel>
                        <FormControl><Input type="text" placeholder="••••••" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )}/>
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin"/>पुष्टि हो रही है...</> : 'लॉगिन करें'}
                </Button>
                 <Button variant="link" size="sm" className="w-full" onClick={() => setConfirmationResult(null)}>
                    गलत नंबर? वापस जाएं
                </Button>
                </form>
            </Form>
          )}
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
