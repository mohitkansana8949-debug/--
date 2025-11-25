'use client';
import { useState } from 'react';
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
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Loader } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  mobile: z.string().optional(),
  age: z.coerce.number().positive().optional(),
  // Add other fields like state, district, class later
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      mobile: '',
      age: undefined,
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to complete your profile.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: data.name,
      });

      // Update Firestore document
      await setDoc(
        doc(firestore, 'users', user.uid),
        {
          name: data.name,
          mobile: data.mobile,
          age: data.age,
        },
        { merge: true } // Merge to avoid overwriting existing fields like email
      );

      toast({
        title: 'प्रोफ़ाइल अपडेट हो गई',
        description: 'आपकी प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई है।',
      });
      router.push('/');
    } catch (error) {
      console.error(error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error instanceof FirebaseError) {
        description = error.message;
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
  
  if (isUserLoading) {
      return <div className="flex justify-center items-center h-screen"><Loader className="animate-spin" /></div>
  }

  if (!user) {
      router.push('/login');
      return null;
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
                    <FormLabel>पूरा नाम</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>मोबाइल नंबर</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>आयु</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="21" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Add dropdowns for State, District, Class here */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'सहेज रहा है...' : 'प्रोफ़ाइल सहेजें'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
