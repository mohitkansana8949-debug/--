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

    const DURATION = 5000; // 5 seconds

    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, DURATION - 500);

    const unmountTimer = setTimeout(() => {
        setIsLoading(false);
    }, DURATION);
    
    return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(unmountTimer);
    }

  }, []);

  useEffect(() => {
    // Hide splash screen if it has been seen before in the same session
    if (sessionStorage.getItem('splashSeen')) {
        setIsLoading(false);
    } else if (isLoading === false) {
        sessionStorage.setItem('splashSeen', 'true');
    }
  }, [isLoading]);

  if (!isMounted || !isLoading) {
    return null;
  }
  
  const DefaultSplashScreen = () => (
    <div className="flex flex-col items-center justify-center gap-4">
        <h3 className="text-sm text-center font-semibold tracking-widest uppercase text-white/80">
            Made with ❤️ in India
        </h3>
        <svg
            className="h-20 w-20 text-white"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            >
            <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="url(#grad1)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2 17L12 22L22 17"
                stroke="url(#grad2)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2 12L12 17L22 12"
                stroke="url(#grad3)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#FBBF24" />
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
                <linearGradient id="grad3" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#6EE7B7" />
                </linearGradient>
            </defs>
        </svg>

        <h1 className="text-4xl font-bold tracking-tight text-center bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-yellow-400 to-purple-500">
            Quickly Study
        </h1>
        <h2 className="text-lg font-medium text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-300 via-teal-300 to-green-300">
            The Quickest Way of Study
        </h2>
    </div>
  );

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
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-700">
            <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-600"
                style={{ animation: `shrink 5s linear forwards` }}
            />
        </div>

       {customSplashUrl && !settingsLoading ? <CustomSplashScreen url={customSplashUrl} /> : <DefaultSplashScreen />}
       
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
