'use client';

import { useUser, useFirestore } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { Loader } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AppHeader } from '@/components/layout/app-header';
import { NotificationHandler } from '@/components/notification-handler';

const PUBLIC_PATHS = ['/login', '/signup'];
const NO_LAYOUT_PATHS = ['/login', '/signup', '/complete-profile'];
const FULL_SCREEN_PATHS = ['/courses/watch/', '/live-lectures', '/pdf-viewer', '/youtube/', '/certificate/'];
const PROFILE_COMPLETE_PATH = '/complete-profile';

const shouldShowLayout = (pathname: string) => {
    if (NO_LAYOUT_PATHS.includes(pathname)) return false;
    // Check with startsWith for dynamic paths
    if (FULL_SCREEN_PATHS.some(p => pathname.startsWith(p))) return false;
    return true;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const router = useRouter();

  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;
      
    if (!user || !firestore) {
        setIsProfileComplete(false);
        setIsCheckingProfile(false);
        return;
    }
    
    setIsCheckingProfile(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists() && doc.data().profileComplete === true) {
            setIsProfileComplete(true);
        } else {
            setIsProfileComplete(false);
        }
        setIsCheckingProfile(false);
    }, (error) => {
        console.error("Error listening to user profile:", error);
        setIsProfileComplete(false);
        setIsCheckingProfile(false);
    });

    return () => unsubscribe();
  }, [user, isUserLoading, firestore]);

  useEffect(() => {
    const isLoading = isUserLoading || isCheckingProfile;
    if (isLoading) {
      return; // Wait until all checks are done
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);
    const isAdminPath = pathname.startsWith('/admin');
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
      } else if (!isProfileComplete && !isProfilePath && !isAdminPath) { // Allow access to admin paths even if profile is incomplete
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
  if (user && !isProfileComplete && !isProfilePath && !pathname.startsWith('/admin')) return null; // Waiting for redirect to /complete-profile
  if (user && isProfileComplete && isProfilePath) return null; // Waiting for redirect from /complete-profile

  if (shouldShowLayout(pathname)) {
      return (
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <NotificationHandler />
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
