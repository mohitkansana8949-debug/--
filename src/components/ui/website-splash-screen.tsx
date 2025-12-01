'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GraduationCap } from 'lucide-react';

export function WebsiteSplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const hasVisited = sessionStorage.getItem('hasVisitedQuicklyStudy');
    
    if (hasVisited) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2500); // Animation duration

    const fadeOutTimer = setTimeout(() => {
        setIsLoading(false);
        sessionStorage.setItem('hasVisitedQuicklyStudy', 'true');
    }, 3000); // Animation duration + fade out time
    
    return () => {
        clearTimeout(timer);
        clearTimeout(fadeOutTimer);
    }

  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white transition-opacity duration-500',
        isFadingOut ? 'opacity-0' : 'opacity-100'
      )}
    >
      <div className="text-center animate-fade-in-up">
        <p className="mb-4 text-sm font-medium tracking-widest uppercase opacity-75">
          Made with ❤️ in India
        </p>
        <div className="flex items-center justify-center gap-4 mb-4">
            <GraduationCap className="h-16 w-16 text-primary animate-pulse" />
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter">
                Quickly Study
            </h1>
        </div>
        <p className="text-lg text-white/80 font-display mt-2">
            The Quickest way of Study
        </p>
      </div>

       <div className="absolute bottom-8 text-center text-xs text-white/50 animate-fade-in-up animation-delay-500">
            <p>UPSC | SAINIK SCHOOL | MILITARY SCHOOL | NEET | JEE | EBOOK | PDF</p>
       </div>
       <style jsx>{`
        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-up {
            animation: fade-in-up 1s ease-out forwards;
        }
        .animation-delay-500 {
            animation-delay: 0.5s;
        }
       `}</style>
    </div>
  );
}
