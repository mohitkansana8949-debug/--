
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
    
    let promptText = `You are an expert AI tutor for students preparing for competitive exams in India. A student has a doubt. Provide a clear, concise, and helpful answer in ${input.language}.`;

    if (input.imageUrl) {
        promptText += `\n\nThe user has provided an image. Analyze it carefully.`;
    }
    
    if (input.doubt) {
        promptText += `\n\nStudent's Question: "${input.doubt}"`;
    } else if (input.imageUrl) {
        promptText += "\n\nStudent's Question is in the image. Analyze the image to understand and answer the question.";
    }

    const promptParts: any[] = [promptText];

    if (input.imageUrl) {
        promptParts.push({ media: { url: input.imageUrl } });
    }
    
    promptParts.push(`\n\nYour Answer (in ${input.language}):`);

    const llmResponse = await ai.generate({
      prompt: promptParts,
      config: {
        temperature: 0.5, 
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
