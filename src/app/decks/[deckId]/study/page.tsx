import { StudyMode } from "@/components/flashcards/study-mode";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Study Mode | QuklyStudy',
    description: 'Review your flashcards and master the material.',
};

export default function StudyPage() {
    return <StudyMode />;
}
