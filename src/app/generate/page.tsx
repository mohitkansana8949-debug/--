import { FlashcardGenerator } from "@/components/flashcards/flashcard-generator";
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Generate Flashcards | QuklyStudy',
    description: 'Generate flashcards from your notes using AI.',
};

export default function GeneratePage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Generate Flashcards</h1>
                <p className="text-muted-foreground">
                    Paste your text or upload a file to automatically create a new study deck.
                </p>
            </div>
            <FlashcardGenerator />
        </div>
    );
}
