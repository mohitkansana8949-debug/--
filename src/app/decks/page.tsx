import type { Metadata } from 'next';
import { DeckList } from '@/components/flashcards/deck-list';

export const metadata: Metadata = {
    title: 'My Decks | QuklyStudy',
    description: 'Browse and manage all your flashcard decks.',
};

export default function DecksPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">My Decks</h1>
                <p className="text-muted-foreground">
                    Here are all your study decks. Choose one to start learning!
                </p>
            </div>
            <DeckList />
        </div>
    );
}
