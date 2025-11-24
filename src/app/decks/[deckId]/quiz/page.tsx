import { QuizMode } from "@/components/flashcards/quiz-mode";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Quiz Mode | QuklyStudy',
    description: 'Test your knowledge with a quiz.',
};

export default function QuizPage() {
    return <QuizMode />;
}
