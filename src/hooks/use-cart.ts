
'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useToast } from '@/hooks/use-toast';
import type { CartItem, Book } from '@/lib/types';

interface CartState {
  cart: CartItem[];
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCart = create(
  persist<CartState>(
    (set, get) => ({
      cart: [],
      addToCart: (book) => {
        const { toast } = useToast();
        const currentCart = get().cart;
        const existingItem = currentCart.find((item) => item.id === book.id);

        if (existingItem) {
          toast({ title: "Already in cart", description: "You can update the quantity in your cart." });
          return;
        }

        set({
          cart: [...currentCart, {
            id: book.id,
            name: book.name,
            price: book.price,
            imageUrl: book.imageUrl,
            quantity: 1,
          }],
        });
        toast({ title: "Added to cart", description: `"${book.name}" has been added to your cart.` });
      },
      removeFromCart: (bookId) => {
         const { toast } = useToast();
         set({ cart: get().cart.filter((item) => item.id !== bookId) });
         toast({ title: "Removed from cart" });
      },
      updateQuantity: (bookId, quantity) => {
        if (quantity < 1) {
            get().removeFromCart(bookId);
            return;
        }
        set({
          cart: get().cart.map((item) =>
            item.id === bookId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'bookshala-cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
