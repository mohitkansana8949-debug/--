
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BookSummaryInputSchema = z.object({
  bookName: z.string().describe("The name of the book."),
  authorName: z.string().describe("The name of the book's author."),
});
export type BookSummaryInput = z.infer<typeof BookSummaryInputSchema>;

const BookSummaryOutputSchema = z.object({
  summary: z.string().describe("A short, engaging, one-paragraph summary of the book suitable for an online store description. It should be in Hindi."),
});
export type BookSummaryOutput = z.infer<typeof BookSummaryOutputSchema>;

export async function generateBookSummaryFlow(input: BookSummaryInput): Promise<BookSummaryOutput> {
  return await bookSummaryFlow(input);
}

const bookSummaryFlow = ai.defineFlow(
  {
    name: 'bookSummaryFlow',
    inputSchema: BookSummaryInputSchema,
    outputSchema: BookSummaryOutputSchema,
  },
  async (input) => {
    
    const prompt = `You are a professional book marketer. Your task is to write a short, engaging, one-paragraph summary for an online bookstore. The summary must be in Hindi.

    **Book Name:** "${input.bookName}"
    **Author:** ${input.authorName}

    **Instructions:**
    1.  The summary must be in the **Hindi** language.
    2.  It should be a single paragraph.
    3.  Make it captivating and enticing to encourage students and readers to buy the book.
    4.  Focus on the key benefits and what the reader will learn.
    5.  Format the output as a valid JSON object matching the provided schema. Do not include any extra text or explanations outside the JSON structure.`;
    
    const llmResponse = await ai.generate({
      prompt: prompt,
      config: {
        temperature: 0.7,
        response_mime_type: "application/json"
      }
    });

    const structuredResponse = llmResponse.output();
    if (!structuredResponse) {
        throw new Error("AI did not return a valid JSON object.");
    }
    
    return {
      summary: structuredResponse.summary,
    };
  }
);
