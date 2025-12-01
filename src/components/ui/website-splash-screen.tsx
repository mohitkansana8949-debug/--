'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function WebsiteSplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { firestore } = useFirebase();

  const appSettingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
  const { data: appSettings, isLoading: settingsLoading } = useDoc(appSettingsRef);

  const customSplashUrl = appSettings?.splashScreenUrl;

  useEffect(() => {
    setIsMounted(true);
    // This effect runs only on the client
    if (sessionStorage.getItem('splashSeen')) {
      setIsLoading(false);
      return;
    }

    const DURATION = 5000; 

    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, DURATION - 500);

    const unmountTimer = setTimeout(() => {
      setIsLoading(false);
      sessionStorage.setItem('splashSeen', 'true');
    }, DURATION);
    
    return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(unmountTimer);
    }

  }, []);

  if (!isMounted || !isLoading) {
    return null;
  }
  
  const CustomSplashScreen = ({ url }: {url: string}) => (
       <div 
        className="w-full h-full bg-cover bg-center animate-fall-in"
        style={{ backgroundImage: `url(${url})` }}
      />
  );

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-900 text-white transition-opacity duration-500 overflow-hidden',
        isFadingOut ? 'opacity-0' : 'opacity-100'
      )}
    >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-700/50">
            <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-600"
                style={{ animation: `shrink 5s linear forwards` }}
            />
        </div>

       {customSplashUrl && !settingsLoading ? (
            <CustomSplashScreen url={customSplashUrl} />
        ) : (
             <div className="flex items-center justify-center h-full w-full bg-background">
                {/* Fallback to a simple loader if no custom URL is set, but not the default branded one */}
             </div>
        )}
       
       <style jsx>{`
        @keyframes fall-in {
            from { opacity: 0; transform: scale(1.1); }
            to { opacity: 1; transform: scale(1); }
        }
        @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
        }
        .animate-fall-in { animation: fall-in 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
       `}</style>
    </div>
  );
}
