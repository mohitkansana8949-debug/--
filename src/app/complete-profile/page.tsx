
'use client';
import { useState, useRef, ChangeEvent } from 'react';
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
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Loader, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { errorEmitter, FirestorePermissionError } from '@/firebase';


const profileSchema = z.object({
  name: z.string().min(2, 'कम से कम 2 अक्षर का नाम होना चाहिए।'),
  mobile: z.string().optional(),
  age: z.coerce.number().positive().optional(),
  photoURL: z.string().url('कृपया एक मान्य URL दर्ज करें।').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const removeUndefined = (obj: any) => {
    const newObj: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        newObj[key] = obj[key] ?? null;
      }
    }
    return newObj;
  };


export default function CompleteProfilePage() {
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.displayName || '',
      mobile:  '',
      age: undefined,
      photoURL: user?.photoURL || '',
    }
  });

  const photoURL = form.watch('photoURL');
  
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
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: data.name,
        photoURL: data.photoURL || null,
      });

      // Prepare data for Firestore, ensuring no undefined values
      const profileData = {
        name: data.name,
        mobile: data.mobile,
        age: data.age,
        photoURL: data.photoURL,
      };

      const cleanedProfileData = removeUndefined(profileData);
      const userRef = doc(firestore, 'users', user.uid);

      setDoc(userRef, cleanedProfileData, { merge: true })
        .then(() => {
            toast({
                title: 'प्रोफ़ाइल अपडेट हो गई',
                description: 'आपकी प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई है।',
              });
            router.push('/');
        })
        .catch((dbError) => {
            const contextualError = new FirestorePermissionError({
                operation: 'update',
                path: userRef.path,
                requestResourceData: cleanedProfileData,
            });
            errorEmitter.emit('permission-error', contextualError);
            // We don't need to re-throw here because the emitter handles it.
        });
    } catch (error) {
      console.error("Profile update error:", error);
      let description = 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।';
      if (error instanceof FirebaseError) {
        description = error.message;
      } else if (error instanceof Error) {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'प्रोफ़ाइल अपडेट विफल',
        description,
      });
      setIsLoading(false); // Only set loading to false in case of an error.
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
              
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoURL || undefined} data-ai-hint="person face" />
                  <AvatarFallback>{user.displayName?.substring(0, 2) || 'QS'}</AvatarFallback>
                </Avatar>
              </div>

               <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>फोटो URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/photo.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>पूरा नाम</FormLabel>
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
                    <FormLabel>मोबाइल नंबर</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="9876543210" {...field} value={field.value ?? ''} />
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
                      <Input type="number" placeholder="21" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
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
