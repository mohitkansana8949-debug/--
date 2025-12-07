
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const TrickInputSchema = z.object({
  topic: z.string().describe('The topic for which a trick is needed.'),
});
export type TrickInput = z.infer<typeof TrickInputSchema>;

const TrickOutputSchema = z.object({
  trick: z.string().describe('A creative and memorable trick, mnemonic, or short story to remember the topic. It should be in Hindi if the topic is in Hindi, otherwise in English.'),
  context: z.string().describe('A brief explanation of what the trick helps to remember, including a breakdown of the mnemonic if applicable. For example: "This trick helps you remember all 50 districts of Rajasthan. G means Ganganagar, B means Banswara..."'),
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
    
    const prompt = `You are an exceptionally creative teacher from India, renowned for crafting unforgettable and often humorous tricks, mnemonics, and short stories (kahaniya) to help students in India remember complex topics for competitive exams.

    **Topic to create a trick for:** "${input.topic}"

    **Your Task:**
    1.  Analyze the topic. It could be a list of items (like districts, kings, rivers), a sequence of historical events, a scientific concept, or anything else.
    2.  Create a simple, highly effective, and very creative trick to help remember it. The trick should be catchy and easy to recall. This can be:
        *   An acronym (like VIBGYOR for rainbow colors).
        *   A memorable, rhythmic, or funny sentence/phrase (like a Bollywood dialogue or a simple rhyme).
        *   A short, imaginative, and funny story that logically connects all the elements of the topic.
    3.  **Language:** If the topic is in Hindi or related to Indian context (like "गुहिल राजवंश" or "राजस्थान के जिले"), the trick and context **MUST** also be in Hinglish or pure Hindi. Otherwise, create it in English.
    4.  **Breakdown is CRUCIAL:** If the list is long, feel free to break it down into smaller, manageable tricks. For each trick, provide a clear breakdown.
    5.  **Output Structure:**
        *   **'trick' field:** Provide the main trick itself. This should be the core mnemonic, sentence, or story.
        *   **'context' field:** First, provide a one-sentence explanation of what the trick is for. Then, provide a detailed breakdown of how the trick works, explaining what each part of the mnemonic stands for. For example: "यह ट्रिक आपको गुहिल राजवंश के शासकों को क्रम में याद रखने में मदद करती है। **Guhil** से गुहिल, **Bapa** से बप्पा रावल, **Nag** से नागदा..." or "This trick helps you remember the planets in order from the sun. **My** = Mercury, **Very** = Venus, **Eager** = Earth...". Make the breakdown very clear.
    6.  The final output must be a valid JSON object matching the provided schema, containing both the 'trick' and the 'context'. Do not include any extra text, explanations, or markdown formatting outside the JSON structure.
    
    **Example for "Guhil Dynasty":**
    {
      "trick": "गुहिल बापा नाग पर बैठकर खुमान-रतन के संग, तेज समर में हार गए।",
      "context": "यह ट्रिक आपको गुहिल वंश के महत्वपूर्ण शासकों को क्रम में याद रखने में मदद करती है। **गुहिल** से गुहिल, **बापा** से बप्पा रावल, **नाग** से नागभट्ट, **खुमान-रतन** से खुमान और रतनसिंह, **तेज** से तेजसिंह, और **समर** से समरसिंह।"
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
