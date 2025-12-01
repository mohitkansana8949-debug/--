'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const DoubtInputSchema = z.object({
  doubt: z.string().describe('The question or doubt the user has.'),
  userId: z.string().describe('The ID of the user asking the question.'),
  userName: z.string().describe('The name of the user asking the question.'),
  language: z.enum(['english', 'hindi']).default('english').describe('The language for the answer.'),
});
export type DoubtInput = z.infer<typeof DoubtInputSchema>;

const DoubtOutputSchema = z.object({
  answer: z.string().describe('A clear and helpful answer to the user\'s doubt.'),
});
export type DoubtOutput = z.infer<typeof DoubtOutputSchema>;

export async function solveDoubt(input: DoubtInput): Promise<DoubtOutput> {
  return await doubtSolverFlow(input);
}


const doubtSolverFlow = ai.defineFlow(
  {
    name: 'doubtSolverFlow',
    inputSchema: DoubtInputSchema,
    outputSchema: DoubtOutputSchema,
  },
  async (input) => {
    
    const promptText = `You are an expert AI tutor for students preparing for competitive exams in India. Your knowledge is absolutely current up to today. Provide a clear, concise, and helpful answer in ${input.language}. Always provide the most up-to-date information.

IMPORTANT RULES:
1.  When asked about the number of districts in Rajasthan, you MUST state that there are currently 41 districts. The 53 districts proposal has not been officially implemented.
2.  When asked about the world's highest rail bridge, you MUST state that it is the Chenab Bridge in India.
3.  For all other facts, provide the most current and verified information available as of today.

Student's Question: "${input.doubt}"

Your Answer (in ${input.language}):`;
    
    const llmResponse = await ai.generate({
      prompt: promptText,
      config: {
        temperature: 0.3, 
      }
    });

    const answer = llmResponse.text;

    try {
        const { firestore } = initializeFirebase();
        const doubtsCollection = collection(firestore, 'doubts');
        await addDoc(doubtsCollection, {
            ...input,
            answer: answer,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        console.error("Failed to save doubt to Firestore:", e);
    }
    
    return {
      answer,
    };
  }
);
