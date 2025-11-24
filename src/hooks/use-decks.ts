"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Deck } from '@/lib/types';

const DECKS_STORAGE_KEY = 'quklystudy-decks';

const getInitialDecks = (): Deck[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const item = window.localStorage.getItem(DECKS_STORAGE_KEY);
        if (item) {
            const decks = JSON.parse(item) as Deck[];
            if (decks.length > 0) {
                return decks;
            }
        }
    } catch (error) {
        console.warn(`Error reading localStorage key “${DECKS_STORAGE_KEY}”:`, error);
    }
    
    // Return sample data if nothing in local storage or on error
    return getSampleDecks();
};

const getSampleDecks = (): Deck[] => {
    const now = new Date();
    return [
        {
            id: 'sample-deck-1',
            title: 'World Capitals',
            description: 'A simple deck to learn world capitals.',
            createdAt: new Date(now.setDate(now.getDate() - 2)).toISOString(),
            flashcards: [
                { id: 'fc-1-1', question: 'What is the capital of Japan?', answer: 'Tokyo', isLearned: true },
                { id: 'fc-1-2', question: 'What is the capital of France?', answer: 'Paris', isLearned: false },
                { id: 'fc-1-3', question: 'What is the capital of Egypt?', answer: 'Cairo', isLearned: true },
                { id: 'fc-1-4', question: 'What is the capital of Brazil?', answer: 'Brasília', isLearned: false },
            ]
        },
        {
            id: 'sample-deck-2',
            title: 'Basic Chemistry',
            description: 'Fundamental concepts in chemistry.',
            createdAt: new Date(now.setDate(now.getDate() - 5)).toISOString(),
            flashcards: [
                { id: 'fc-2-1', question: 'What is the chemical symbol for water?', answer: 'H2O', isLearned: false },
                { id: 'fc-2-2', question: 'What is the most abundant gas in Earth\'s atmosphere?', answer: 'Nitrogen', isLearned: false },
                { id: 'fc-2-3', question: 'What is the atomic number of Carbon?', answer: '6', isLearned: false },
            ]
        }
    ];
};

export function useDecks() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setDecks(getInitialDecks());
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            try {
                window.localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
            } catch (error) {
                console.warn(`Error setting localStorage key “${DECKS_STORAGE_KEY}”:`, error);
            }
        }
    }, [decks, isLoaded]);

    const addDeck = useCallback((newDeckData: Omit<Deck, 'id' | 'createdAt'>) => {
        const newDeck: Deck = {
            ...newDeckData,
            id: `deck-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        setDecks(prevDecks => [newDeck, ...prevDecks]);
        return newDeck;
    }, []);
    
    const getDeckById = useCallback((deckId: string) => {
        return decks.find(deck => deck.id === deckId);
    }, [decks]);

    const updateDeck = useCallback((deckId: string, updatedData: Partial<Deck>) => {
        setDecks(prevDecks => prevDecks.map(deck =>
            deck.id === deckId ? { ...deck, ...updatedData } : deck
        ));
    }, []);

    const deleteDeck = useCallback((deckId: string) => {
        setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
    }, []);

    return { decks, isLoaded, addDeck, getDeckById, updateDeck, deleteDeck };
}
