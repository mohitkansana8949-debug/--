
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GraduationCap } from 'lucide-react';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function WebsiteSplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const { firestore } = useFirebase();

  const appSettingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
  const { data: appSettings, isLoading: settingsLoading } = useDoc(appSettingsRef);

  const customSplashUrl = appSettings?.splashScreenUrl;

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedQuicklyStudy');
    
    if (hasVisited) {
      setIsLoading(false);
      return;
    }

    // Show splash for 10 seconds
    const timer = setTimeout(() => {
      setIsFadingOut(true);
    }, 9500); 

    const fadeOutTimer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('hasVisitedQuicklyStudy', 'true');
    }, 10000); // Total 10 seconds
    
    return () => {
        clearTimeout(timer);
        clearTimeout(fadeOutTimer);
    }

  }, []);

  if (!isLoading) {
    return null;
  }
  
  const FallbackSplashScreen = () => (
    <div className="text-center">
        <p className="mb-4 text-sm font-medium tracking-widest uppercase opacity-75 animate-fade-in-up animation-delay-0">
          Made with ❤️ in India
        </p>
        <div className="flex flex-col items-center justify-center gap-4 mb-4 animate-fade-in-up animation-delay-300">
            <GraduationCap className="h-16 w-16 text-primary animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-red-500 via-yellow-400 to-pink-500 text-transparent bg-clip-text">
                Quickly Study
            </h1>
        </div>
        <p className="text-lg bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text font-display mt-2 animate-fade-in-up animation-delay-600">
            The Quickest way of Study
        </p>
        <div className="absolute bottom-8 left-0 right-0 text-center text-xs text-white/50 animate-fade-in-up animation-delay-900">
            <p>UPSC | SAINIK SCHOOL | MILITARY SCHOOL | NEET | JEE | EBOOK | PDF</p>
       </div>
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
       {settingsLoading ? null : customSplashUrl ? <CustomSplashScreen url={customSplashUrl} /> : <FallbackSplashScreen />}
       
       <style jsx>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fall-in {
            from { opacity: 0; transform: translateY(-100vh); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 1s ease-out forwards; }
        .animate-fall-in { animation: fall-in 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        
        .animation-delay-0 { animation-delay: 0s; }
        .animation-delay-300 { animation-delay: 0.3s; }
        .animation-delay-600 { animation-delay: 0.6s; }
        .animation-delay-900 { animation-delay: 0.9s; }
       `}</style>
    </div>
  );
}
