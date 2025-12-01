
'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDoc, useFirebase, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Progress } from '@/components/ui/progress';

export function WebsiteSplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const { firestore } = useFirebase();

  const appSettingsRef = useMemoFirebase(() => (firestore ? doc(firestore, 'settings', 'app') : null), [firestore]);
  const { data: appSettings, isLoading: settingsLoading } = useDoc(appSettingsRef);

  const customSplashUrl = appSettings?.splashScreenUrl || 'https://i.supaimg.com/666f0c51-e68b-44ff-93fe-f7366ef31930.jpg';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const hasVisited = sessionStorage.getItem('hasVisitedQuicklyStudy');
    
    if (hasVisited) {
      setIsLoading(false);
      return;
    }

    const DURATION = 20000; // 20 seconds

    const progressInterval = setInterval(() => {
        setProgress(prev => {
            if (prev >= 100) {
                clearInterval(progressInterval);
                return 100;
            }
            return prev + (100 / (DURATION / 100));
        });
    }, 100);

    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, DURATION - 500); 

    const unmountTimer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('hasVisitedQuicklyStudy', 'true');
    }, DURATION);
    
    return () => {
        clearInterval(progressInterval);
        clearTimeout(fadeOutTimer);
        clearTimeout(unmountTimer);
    }

  }, [isMounted]);

  if (!isLoading) {
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
       {settingsLoading ? null : <CustomSplashScreen url={customSplashUrl} />}
       <div className="absolute bottom-10 w-11/12 max-w-sm">
           <Progress value={progress} className="h-2 [&>div]:bg-white/50" />
       </div>
       
       <style jsx>{`
        @keyframes fall-in {
            from { opacity: 0; transform: translateY(-20vh); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fall-in { animation: fall-in 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
       `}</style>
    </div>
  );
}
