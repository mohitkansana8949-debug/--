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
import { useAuth, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { Loader, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initializeFirebase } from '@/firebase';

const profileSchema = z.object({
  name: z.string().min(2, 'कम से कम 2 अक्षर का नाम होना चाहिए।'),
  mobile: z.string().optional(),
  age: z.coerce.number().positive().optional(),
  // Add other fields like state, district, class later
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { firebaseApp } = initializeFirebase();
  const storage = getStorage(firebaseApp);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      mobile: '',
      age: undefined,
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (file: File, userId: string): Promise<string> => {
    const storageRef = ref(storage, `profile_pictures/${userId}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  }

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'प्रोफ़ाइल पूरी करने के लिए आपको लॉग इन होना चाहिए।',
      });
      return;
    }

    setIsLoading(true);
    try {
      let photoURL = user.photoURL;

      if (photo) {
        photoURL = await uploadPhoto(photo, user.uid);
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: data.name,
        photoURL: photoURL,
      });

      // Update Firestore document
      await setDoc(
        doc(firestore, 'users', user.uid),
        {
          name: data.name,
          mobile: data.mobile,
          age: data.age,
          photoURL: photoURL,
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
      let description = 'एक अप्रत्याशित त्रुटि हुई। कृपया पुनः प्रयास करें।';
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
              
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoPreview || user.photoURL || undefined} data-ai-hint="person face" />
                  <AvatarFallback>{user.displayName?.substring(0, 2) || 'QS'}</AvatarFallback>
                </Avatar>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  फोटो अपलोड करें
                </Button>
                <Input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange} 
                />
              </div>

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
