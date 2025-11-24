export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  isLearned?: boolean;
};

export type Deck = {
  id:string;
  title: string;
  description: string;
  flashcards: Flashcard[];
  createdAt: string; // ISO string
};
