
import { Timestamp } from "firebase/firestore";

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
  signUpDate: Timestamp;
  profileComplete?: boolean;
  mobile?: string;
  category?: string;
  state?: string;
  class?: string;
}

export type CourseContent = {
    id: string;
    type: 'youtube' | 'video' | 'pdf' | 'pyq' | 'test';
    title: string;
    url?: string;
    thumbnail?: string;
    data?: any; // For JSON content like tests
    isLive?: boolean; // To control live status
}

export interface Course {
  id: string;
  name: string;
  description: string;
  price: number;
  thumbnailUrl: string;
  isFree: boolean;
  content: CourseContent[];
}

export interface Enrollment {
  id: string;
  userId: string;
  itemId: string; // Can be courseId, ebookId, testId, etc.
  itemType: 'course' | 'ebook' | 'pyq' | 'test';
  itemName: string; // Denormalized for easier display
  enrollmentDate: Timestamp;
  paymentMethod: string;
  paymentTransactionId: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type TestQuestion = {
  question: string;
  options: string[];
  answer: string;
};

export interface TestSeries {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  isFree: boolean;
  questions: TestQuestion[];
  bundledCourseId?: string | null;
}

export interface Ebook {
  id: string;
  name: string;
  description: string;
  price: number;
  isFree: boolean;
  pdfUrl: string;
  thumbnailUrl?: string;
}

export interface PYQ {
    id: string;
    name: string;
    description: string;
    price: number;
    isFree: boolean;
    pdfUrl: string;
    thumbnailUrl?: string;
}

