
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { useFirebase, useUser } from '@/firebase';
import { doc, setDoc, onSnapshot, serverTimestamp, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Loader } from 'lucide-react';
import { errorEmitter, FirestorePermissionError } from '@/firebase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { statesOfIndia } from '@/lib/states';

const profileSchema = z.object({
  name: z.string().min(2, 'कम से कम 2 अक्षर का नाम होना चाहिए।'),
  mobile: z.string().optional(),
  category: z.string().optional(),
  state: z.string().optional(),
  class: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      mobile: '',
      category: '',
      state: '',
      class: '',
    }
  });

  useEffect(() => {
    if (user && firestore) {
      const userRef = doc(firestore, 'users', user.uid);
      const unsub = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          form.reset({
             name: user.displayName || data.name || '',
             mobile: data.mobile || '',
             category: data.category || '',
             state: data.state || '',
             class: data.class || '',
          });
        } else {
            form.reset({ name: user.displayName || '' });
        }
      });
      return () => unsub();
    }
  }, [user, firestore, form]);
  
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !auth || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'प्रोफ़ाइल पूरी करने के लिए आपको लॉग इन होना चाहिए।',
      });
      return;
    }

    setIsLoading(true);
    
    const userRef = doc(firestore, 'users', user.uid);

    try {
      
      const profileData: any = {
          name: data.name,
          email: user.email, 
          mobile: data.mobile || null,
          category: data.category || null,
          state: data.state || null,
          class: data.class || null,
          profileComplete: true, // Flag to indicate profile is complete
      };

      // Check if this is a new user document
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
          profileData.signUpDate = serverTimestamp();
      }

      if (user.displayName !== data.name) {
        await updateProfile(user, { displayName: data.name });
      }

      await setDoc(userRef, profileData, { merge: true });

      toast({
        title: 'प्रोफ़ाइल अपडेट हो गई',
        description: 'आपकी प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई है।',
      });
      
      router.replace('/');

    } catch (error) {
      console.error("Profile update error:", error);
      let description = 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।';
      if (error instanceof FirebaseError) {
        description = error.message;
      } else {
         const contextualError = new FirestorePermissionError({
            operation: 'update',
            path: `users/${user.uid}`,
            requestResourceData: data,
         });
         errorEmitter.emit('permission-error', contextualError);
         description = 'अनुमति त्रुटि। प्रोफ़ाइल को सहेजने में विफल।';
      }
      toast({
        variant: 'destructive',
        title: 'प्रोफ़ाइल अपडेट विफल',
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isUserLoading || !user) {
      return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin" /></div>
  }

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>अपनी प्रोफ़ाइल पूरी करें</CardTitle>
          <CardDescription>
            शुरू करने के लिए कृपया अपनी जानकारी दर्ज करें।
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="जैसे, मोहित कुमार" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

             <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="अपनी श्रेणी चुनें" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="OBC">OBC</SelectItem>
                                <SelectItem value="SC">SC</SelectItem>
                                <SelectItem value="ST">ST</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>State</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="अपना राज्य चुनें" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {statesOfIndia.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Class / Exam</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="अपनी कक्षा या परीक्षा चुनें" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="1 to 12th">1 to 12th</SelectItem>
                                <SelectItem value="Rashtriya Military School">Rashtriya Military School</SelectItem>
                                <SelectItem value="Sainik School">Sainik School</SelectItem>
                                <SelectItem value="UPSC">UPSC</SelectItem>
                                <SelectItem value="Other Government Exam">Other Government Exam</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
                />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader className="mr-2 h-4 w-4 animate-spin"/>सहेज रहा है...</> : 'प्रोफ़ाइल सहेजें'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
