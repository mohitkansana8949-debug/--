
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
  imageUrl: z.string().url().nullable().describe('An optional image URL related to the doubt.'),
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
    
    // 1. Construct the prompt
    const promptParts: any[] = [
        `You are an expert AI tutor for students preparing for competitive exams in India. A student has a doubt. Provide a clear, concise, and helpful answer in ${input.language}.`
    ];

    if (input.doubt) {
        promptParts.push(`\n\nStudent's Question: "${input.doubt}"`);
    }

    if (input.imageUrl) {
        promptParts.push({ media: { url: input.imageUrl } });
        if (!input.doubt) {
             promptParts.push("\n\nStudent's Question: (Analyze the attached image)");
        }
    }
    
    promptParts.push(`\n\nYour Answer (in ${input.language}):`);

    // 2. Generate the answer using the LLM
    const llmResponse = await ai.generate({
      prompt: promptParts,
      config: {
        temperature: 0.5, // Be more factual
      }
    });

    const answer = llmResponse.text;

    // 3. Save the interaction to Firestore
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
    
    // 4. Return the generated answer
    return {
      answer,
    };
  }
);
