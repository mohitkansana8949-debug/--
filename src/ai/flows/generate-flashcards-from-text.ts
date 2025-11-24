'use server';
/**
 * @fileOverview This file contains a Genkit flow that generates flashcards from text.
 *
 * The flow takes text as input and returns a list of flashcard objects, each containing a question and an answer.
 * generateFlashcardsFromText - The main function to generate flashcards from text.
 * GenerateFlashcardsFromTextInput - The input type for the generateFlashcardsFromText function.
 * GenerateFlashcardsFromTextOutput - The output type for the generateFlashcardsFromText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsFromTextInputSchema = z.object({
  text: z
    .string()
    .describe(
      'The text from which to generate flashcards. This could be notes, textbook excerpts, or any other study material.'
    ),
});
export type GenerateFlashcardsFromTextInput = z.infer<
  typeof GenerateFlashcardsFromTextInputSchema
>;

const FlashcardSchema = z.object({
  question: z.string().describe('The question part of the flashcard.'),
  answer: z.string().describe('The answer to the question.'),
});

const GenerateFlashcardsFromTextOutputSchema = z.array(FlashcardSchema).describe(
  'An array of flashcard objects, each containing a question and an answer.'
);
export type GenerateFlashcardsFromTextOutput = z.infer<
  typeof GenerateFlashcardsFromTextOutputSchema
>;

export async function generateFlashcardsFromText(
  input: GenerateFlashcardsFromTextInput
): Promise<GenerateFlashcardsFromTextOutput> {
  return generateFlashcardsFromTextFlow(input);
}

const generateFlashcardsPrompt = ai.definePrompt({
  name: 'generateFlashcardsPrompt',
  input: {schema: GenerateFlashcardsFromTextInputSchema},
  output: {schema: GenerateFlashcardsFromTextOutputSchema},
  prompt: `You are an expert educator. Your task is to generate flashcards from the given text. Each flashcard should have a question and an answer.

Text: {{{text}}}

Please generate flashcards based on the text above. Focus on key concepts and important details.

Your response should be an array of flashcard objects, where each object has a "question" and an "answer" field.

Example:
[
  {
    "question": "What is the capital of France?",
    "answer": "Paris"
  },
  {
    "question": "What is the formula for water?",
    "answer": "H2O"
  }
]
`,
});

const generateFlashcardsFromTextFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFromTextFlow',
    inputSchema: GenerateFlashcardsFromTextInputSchema,
    outputSchema: GenerateFlashcardsFromTextOutputSchema,
  },
  async input => {
    const {output} = await generateFlashcardsPrompt(input);
    return output!;
  }
);
