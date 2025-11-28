
'use client';

import { useUser, useFirestore } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';

const PUBLIC_PATHS = ['/login', '/signup'];
const NO_LAYOUT_PATHS = ['/login', '/signup', '/complete-profile'];
const FULL_SCREEN_PATHS = ['/courses/watch/', '/pdf-viewer', '/youtube/'];
const PROFILE_COMPLETE_PATH = '/complete-profile';

const shouldShowLayout = (pathname: string) => {
    if (NO_LAYOUT_PATHS.includes(pathname)) return false;
    if (FULL_SCREEN_PATHS.some(p => pathname.startsWith(p))) return false;
    return true;
}

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

  if (shouldShowLayout(pathname)) {
      return (
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <AppHeader />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
      )
  }

  // Render children only when all checks pass and no redirection is needed
  return <>{children}</>;
}

    