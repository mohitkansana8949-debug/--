
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

// This flow is designed to be simple for now.
// It takes a user's doubt, generates an answer, and stores the interaction.

const DoubtInputSchema = z.object({
  doubt: z.string().describe('The question or doubt the user has.'),
  userId: z.string().describe('The ID of the user asking the question.'),
  userName: z.string().describe('The name of the user asking the question.'),
});
export type DoubtInput = z.infer<typeof DoubtInputSchema>;

const DoubtOutputSchema = z.object({
  answer: z.string().describe('A clear and helpful answer to the user\'s doubt.'),
});
export type DoubtOutput = z.infer<typeof DoubtOutputSchema>;

// This is the main function you'll call from your frontend.
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
    
    // 1. Generate the answer using the LLM
    const llmResponse = await ai.generate({
      prompt: `You are an expert AI tutor for students preparing for competitive exams in India. A student has a doubt. Provide a clear, concise, and helpful answer.
      
      Student's Question: "${input.doubt}"

      Your Answer:`,
      config: {
        temperature: 0.5, // Be more factual
      }
    });

    const answer = llmResponse.text;

    // 2. Save the interaction to Firestore (optional but good for tracking)
    try {
        const { firestore } = initializeFirebase();
        const doubtsCollection = collection(firestore, 'doubts');
        await addDoc(doubtsCollection, {
            ...input,
            answer: answer,
            createdAt: serverTimestamp(),
        });
    } catch (e) {
        // We don't want to fail the whole flow if Firestore write fails.
        // Log the error for debugging.
        console.error("Failed to save doubt to Firestore:", e);
    }
    
    // 3. Return the generated answer
    return {
      answer,
    };
  }
);
