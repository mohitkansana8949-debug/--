
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TrickInputSchema = z.object({
  topic: z.string().describe('The topic for which a trick is needed.'),
});
export type TrickInput = z.infer<typeof TrickInputSchema>;

const TrickOutputSchema = z.object({
  trick: z.string().describe('A creative and memorable trick, mnemonic, or short story to remember the topic. It should be in Hindi if the topic is in Hindi, otherwise in English.'),
  context: z.string().describe('A brief explanation of what the trick helps to remember, e.g., "This trick helps you remember all 50 districts of Rajasthan."'),
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
    5.  First, provide the trick itself.
    6.  Then, provide a one-sentence context explaining what the trick is for. For example: "यह ट्रिक आपको राजस्थान के सभी 50 जिलों को याद करने में मदद करती है।" or "This trick helps you remember the planets in order from the sun."
    7.  The final output must be a valid JSON object matching the provided schema, containing both the 'trick' and the 'context'. Do not include any extra text or explanations.
    
    **Example for "Planets in order":**
    {
      "trick": "My Very Eager Mother Just Served Us Noodles",
      "context": "This trick helps remember the planets in order from the sun (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune)."
    }`;
    
    const llmResponse = await ai.generate({
      prompt: prompt,
      output: { schema: TrickOutputSchema },
      config: {
        temperature: 0.8,
      }
    });

    const structuredResponse = llmResponse.output;
    if (!structuredResponse || !structuredResponse.trick) {
        throw new Error("AI did not return a valid JSON object with a trick.");
    }
    
    return structuredResponse;
  }
);
