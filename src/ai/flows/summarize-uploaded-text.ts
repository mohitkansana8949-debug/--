'use server';
/**
 * @fileOverview Summarizes uploaded text content into key concepts.
 *
 * - summarizeUploadedText - A function that summarizes text.
 * - SummarizeUploadedTextInput - The input type for the summarizeUploadedText function.
 * - SummarizeUploadedTextOutput - The return type for the summarizeUploadedText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeUploadedTextInputSchema = z.object({
  text: z.string().describe('The text content to summarize.'),
});
export type SummarizeUploadedTextInput = z.infer<typeof SummarizeUploadedTextInputSchema>;

const SummarizeUploadedTextOutputSchema = z.object({
  summary: z.string().describe('A summary of the text content.'),
});
export type SummarizeUploadedTextOutput = z.infer<typeof SummarizeUploadedTextOutputSchema>;

export async function summarizeUploadedText(input: SummarizeUploadedTextInput): Promise<SummarizeUploadedTextOutput> {
  return summarizeUploadedTextFlow(input);
}

const summarizeUploadedTextPrompt = ai.definePrompt({
  name: 'summarizeUploadedTextPrompt',
  input: {schema: SummarizeUploadedTextInputSchema},
  output: {schema: SummarizeUploadedTextOutputSchema},
  prompt: `Summarize the following text into key concepts:\n\n{{{text}}}`,
});

const summarizeUploadedTextFlow = ai.defineFlow(
  {
    name: 'summarizeUploadedTextFlow',
    inputSchema: SummarizeUploadedTextInputSchema,
    outputSchema: SummarizeUploadedTextOutputSchema,
  },
  async input => {
    const {output} = await summarizeUploadedTextPrompt(input);
    return output!;
  }
);
