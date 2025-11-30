
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
  appliedCoupon?: {
    code: string;
    discountAmount: number;
  };
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

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userImage?: string;
    text: string;
    imageUrl?: string;
    createdAt: Timestamp;
    likeCount: number;
    commentCount: number;
}

export interface Like {
    id: string;
    userId: string;
    postId: string;
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userImage?: string;
    postId: string;
    text: string;
    createdAt: Timestamp;
}

export interface Book {
    id: string;
    name: string;
    description: string;
    price: number;
    offer?: string;
    imageUrl: string;
    createdAt: Timestamp;
}

export type CartItem = {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    quantity: number;
}

export type Address = {
    name: string;
    mobile: string;
    address: string;
    pincode: string;
    city: string;
    state: string;
}

export interface BookOrder {
    id: string;
    userId: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    address: Address;
    createdAt: Timestamp;
    status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
    paymentMethod: string;
    paymentId: string;
    trackingId?: string;
    trackingUrl?: string;
    appliedCoupon?: {
        code: string;
        discountAmount: number;
    };
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiresAt?: Timestamp;
  maxUses?: number;
  uses?: number;
  createdAt: Timestamp;
}
