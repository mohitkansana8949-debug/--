"use client";

import { useDecks } from "@/hooks/use-decks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle, BrainCircuit } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

export function StatsCards() {
  const { decks, isLoaded } = useDecks();

  const totalDecks = decks.length;
  const totalFlashcards = decks.reduce((sum, deck) => sum + deck.flashcards.length, 0);
  const learnedFlashcards = decks.reduce((sum, deck) =>
    sum + deck.flashcards.filter(fc => fc.isLearned).length,
  0);

  const stats = [
    { title: "Total Decks", value: totalDecks, icon: BookOpen },
    { title: "Total Flashcards", value: totalFlashcards, icon: BrainCircuit },
    { title: "Learned Flashcards", value: learnedFlashcards, icon: CheckCircle },
  ];

  if (!isLoaded) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  return (
    <div>
        <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
        <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
            <Card key={index} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
            </Card>
        ))}
        </div>
    </div>
  );
}
