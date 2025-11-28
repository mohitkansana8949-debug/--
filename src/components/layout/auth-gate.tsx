
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

const PUBLIC_PATHS = ['/login', '/signup'];

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }

    const isPublicPath = PUBLIC_PATHS.includes(pathname);

    if (!user && !isPublicPath) {
      // If user is not logged in and not on a public page,
      // redirect to login.
      router.push('/login');
    } else if (user && isPublicPath) {
      // If user is logged in and on a public page (login/signup),
      // redirect to the home page.
      router.push('/');
    }
  }, [user, isUserLoading, pathname, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Prevent rendering children on public paths until redirect is complete
  if (!user && !PUBLIC_PATHS.includes(pathname)) {
      return (
        <div className="flex h-screen w-screen items-center justify-center">
          <Loader className="h-8 w-8 animate-spin" />
          <p className="ml-2">Redirecting...</p>
        </div>
      );
  }
  
  // Prevent rendering children if user is logged in but on a public path
  if (user && PUBLIC_PATHS.includes(pathname)) {
       return (
        <div className="flex h-screen w-screen items-center justify-center">
          <Loader className="h-8 w-8 animate-spin" />
          <p className="ml-2">Redirecting...</p>
        </div>
      );
  }


  return <>{children}</>;
}
