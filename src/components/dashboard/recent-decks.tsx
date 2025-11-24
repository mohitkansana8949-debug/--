"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useDecks } from "@/hooks/use-decks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';
import placeholderData from '@/lib/placeholder-images.json';
import { formatDistanceToNow } from 'date-fns';

export function RecentDecks() {
  const { decks, isLoaded } = useDecks();
  const deckImage = placeholderData.placeholderImages.find(p => p.id === 'deck-placeholder');
  const recentDecks = decks.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Recent Decks</h2>
        <Button variant="link" asChild>
          <Link href="/decks">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
      {!isLoaded && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      )}
      {isLoaded && recentDecks.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
            <CardHeader>
                <CardTitle>No Decks Yet</CardTitle>
                <CardDescription>Create your first deck to start studying!</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/generate">Generate a Deck</Link>
                </Button>
            </CardContent>
        </Card>
      )}
      {isLoaded && recentDecks.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recentDecks.map((deck) => (
            <Card key={deck.id} className="flex flex-col hover:shadow-lg transition-shadow">
              {deckImage && <div className="relative h-40 w-full">
                <Image 
                    src={`${deckImage.imageUrl}&t=${deck.id}`} 
                    alt={deck.title} 
                    fill 
                    className="object-cover rounded-t-lg"
                    data-ai-hint={deckImage.imageHint}
                />
              </div>}
              <CardHeader>
                <CardTitle className="truncate">{deck.title}</CardTitle>
                <CardDescription className="line-clamp-2 h-[40px]">{deck.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{deck.flashcards.length} cards</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                    Created {formatDistanceToNow(new Date(deck.createdAt), { addSuffix: true })}
                </p>
                <Button size="sm" asChild>
                  <Link href={`/decks/${deck.id}`}>Study</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
