"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface FlashcardViewProps {
  question: string;
  answer: string;
  className?: string;
  onFlip?: () => void;
}

export function FlashcardView({ question, answer, className, onFlip }: FlashcardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFlipped(prev => !prev);
    if (onFlip) onFlip();
  };

  return (
    <div className={cn("perspective-1000 w-full h-full cursor-pointer group", className)} onClick={handleFlip}>
      <div
        className={cn(
          'relative w-full h-full transform-style-3d transition-transform duration-700',
          isFlipped ? 'rotate-y-180' : ''
        )}
      >
        {/* Front of the card */}
        <Card className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center p-6 text-center shadow-lg">
          <CardContent className="flex flex-col items-center justify-center w-full">
            <p className="text-sm text-muted-foreground mb-4">Question</p>
            <p className="text-xl md:text-2xl font-semibold">{question}</p>
          </CardContent>
           <div className="absolute bottom-4 right-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                <RefreshCw className="w-5 h-5"/>
            </div>
        </Card>

        {/* Back of the card */}
        <Card className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 text-center shadow-lg">
          <CardContent className="flex flex-col items-center justify-center w-full">
            <p className="text-sm text-primary mb-4">Answer</p>
            <p className="text-xl md:text-2xl font-semibold">{answer}</p>
          </CardContent>
           <div className="absolute bottom-4 right-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
                <RefreshCw className="w-5 h-5"/>
            </div>
        </Card>
      </div>
      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
