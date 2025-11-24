"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useDecks } from "@/hooks/use-decks";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Trash2 } from 'lucide-react';
import placeholderData from '@/lib/placeholder-images.json';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export function DeckList() {
  const { decks, isLoaded, deleteDeck } = useDecks();
  const deckImage = placeholderData.placeholderImages.find(p => p.id === 'deck-placeholder');
  const { toast } = useToast();

  const handleDelete = (deckId: string, deckTitle: string) => {
    deleteDeck(deckId);
    toast({
      title: "Deck Deleted",
      description: `The "${deckTitle}" deck has been removed.`,
    });
  };

  return (
    <div>
      {!isLoaded && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      )}
      {isLoaded && decks.length === 0 && (
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
      {isLoaded && decks.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {decks.map((deck) => (
            <Card key={deck.id} className="flex flex-col group/deck relative hover:shadow-lg transition-shadow">
              {deckImage && <Link href={`/decks/${deck.id}`} className="block relative h-40 w-full">
                <Image 
                    src={`${deckImage.imageUrl}&t=${deck.id}`} 
                    alt={deck.title} 
                    fill 
                    className="object-cover rounded-t-lg"
                    data-ai-hint={deckImage.imageHint}
                />
              </Link>}
              <CardHeader>
                <CardTitle className="truncate">{deck.title}</CardTitle>
                <CardDescription className="line-clamp-2 h-[40px]">{deck.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground">{deck.flashcards.length} cards</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(deck.createdAt), { addSuffix: true })}
                </p>
                <Button size="sm" asChild>
                  <Link href={`/decks/${deck.id}`}>Study <ArrowRight className="ml-1 h-4 w-4"/></Link>
                </Button>
              </CardFooter>
               <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 opacity-0 group-hover/deck:opacity-100 transition-opacity h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete deck</span>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the "{deck.title}" deck.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(deck.id, deck.title)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
