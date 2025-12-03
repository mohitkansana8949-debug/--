
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TrickInputSchema = z.object({
  topic: z.string().describe('The topic for which a trick is needed.'),
});
export type TrickInput = z.infer<typeof TrickInputSchema>;

const TrickOutputSchema = z.object({
  trick: z.string().describe('A creative and memorable trick, mnemonic, or short story to remember the topic. It should be in Hindi if the topic is in Hindi, otherwise in English.'),
});
export type TrickOutput = z.infer<typeof TrickOutputSchema>;

export async function generateTrick(input: TrickInput): Promise<TrickOutput> {
  return await trickGeneratorFlow(input);
}

const trickGeneratorFlow = ai.defineFlow(
  {
    name: 'trickGeneratorFlow',
    inputSchema: TrickInputSchema,
    outputSchema: TrickOutputSchema,
  },
  async (input) => {
    
    const prompt = `You are a creative teacher who excels at creating memorable tricks, mnemonics, and short, funny stories to help students remember complex topics.

    **Topic to create a trick for:** "${input.topic}"

    **Your Task:**
    1.  Analyze the topic. It could be a list of items, a sequence of events, a complex concept, or anything else.
    2.  Create a simple, effective, and creative trick to help remember it. This can be:
        *   An acronym (like VIBGYOR for rainbow colors).
        *   A memorable sentence or phrase.
        *   A short, funny, or weird story that connects the elements of the topic.
    3.  If the topic is in Hindi (like "राजस्थान के जिले"), the trick **MUST** also be in Hinglish or Hindi. Otherwise, create it in English.
    4.  If the list is very long, feel free to break it down and create multiple smaller tricks.
    5.  The final output should be just the trick itself, well-formatted, and easy to read. Be creative and make it fun!
    6.  The response should be a valid JSON object containing only the generated trick.
    
    **Example for "Planets in order":**
    "My Very Eager Mother Just Served Us Noodles" (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune).`;
    
    const llmResponse = await ai.generate({
      prompt: prompt,
      config: {
        temperature: 0.8,
        response_mime_type: "application/json"
      }
    });

    const structuredResponse = llmResponse.output;
    if (!structuredResponse || !structuredResponse.trick) {
        throw new Error("AI did not return a valid JSON object with a trick.");
    }
    
    return {
      trick: structuredResponse.trick,
    };
  }
);
