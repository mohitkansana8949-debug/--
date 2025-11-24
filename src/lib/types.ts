export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  isLearned?: boolean;
};

export type Deck = {
  id:string;
  userId: string;
  title: string;
  description: string;
  flashcards: Flashcard[];
  createdAt: string; // ISO string
};

export interface User {
  id: string;
  email: string;
  name: string;
  signUpDate: string; // ISO string for date
}

export interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  isFree: boolean;
  content: string; // This could be markdown, or a more complex structure
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  enrollmentDate: string; // ISO string for date
  paymentMethod: string;
  paymentTransactionId: string;
  adminApproval: boolean;
}
