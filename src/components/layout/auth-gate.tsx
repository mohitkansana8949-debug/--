
'use client';

import { useUser, useFirestore } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

const PUBLIC_PATHS = ['/login', '/signup'];
const PROFILE_COMPLETE_PATH = '/complete-profile';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    const checkUserProfile = async () => {
      if (isUserLoading || !firestore) return;
      
      if (!user) {
        setIsProfileComplete(false);
        setIsCheckingProfile(false);
        return;
      }
      
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        // A profile is complete if the user doc exists and has a 'name' field.
        // You can add more checks here (e.g., for state, class).
        if (userDoc.exists() && userDoc.data().name) {
          setIsProfileComplete(true);
        } else {
          setIsProfileComplete(false);
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
        setIsProfileComplete(false); // Assume incomplete on error
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkUserProfile();
  }, [user, isUserLoading, firestore]);

  useEffect(() => {
    const isLoading = isUserLoading || isCheckingProfile;
    if (isLoading) {
      return; // Wait until all checks are done
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);
    const isProfilePath = pathname === PROFILE_COMPLETE_PATH;

    if (!user) {
      // Not logged in
      if (!isPublicPath) {
        router.push('/signup'); // Force to signup page
      }
    } else {
      // Logged in
      if (isPublicPath) {
        router.push('/'); // Already logged in, redirect from public paths
      } else if (!isProfileComplete && !isProfilePath) {
        router.push(PROFILE_COMPLETE_PATH); // Profile is not complete, force completion
      } else if (isProfileComplete && isProfilePath) {
        router.push('/'); // Profile is complete, redirect from completion page
      }
    }
  }, [user, isUserLoading, isProfileComplete, isCheckingProfile, pathname, router]);

  const isLoading = isUserLoading || isCheckingProfile;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isProfilePath = pathname === PROFILE_COMPLETE_PATH;

  // Show a global loader while we determine auth/profile status
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Logic to prevent flash of content during redirection
  if (!user && !isPublicPath) return null; // Waiting for redirect to /signup
  if (user && isPublicPath) return null; // Waiting for redirect to /
  if (user && !isProfileComplete && !isProfilePath) return null; // Waiting for redirect to /complete-profile
  if (user && isProfileComplete && isProfilePath) return null; // Waiting for redirect from /complete-profile

  // Render children only when all checks pass and no redirection is needed
  return <>{children}</>;
}
