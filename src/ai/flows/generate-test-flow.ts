
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateTestInputSchema = z.object({
  topic: z.string().describe('The topic for the test.'),
  numQuestions: z.number().min(1).max(20).describe('The number of questions to generate.'),
  language: z.enum(['english', 'hindi']).default('hindi').describe('The language for the test questions and options.'),
  duration: z.number().min(1).max(60).describe('The duration of the test in minutes.'),
  userId: z.string().describe('The ID of the user requesting the test.'),
});
export type GenerateTestInput = z.infer<typeof GenerateTestInputSchema>;

const TestQuestionSchema = z.object({
  question: z.string().describe('The question text.'),
  options: z.array(z.string()).length(4).describe('An array of 4 possible answers.'),
  answer: z.string().describe('The correct answer, which must be one of the provided options.'),
});

const GenerateTestOutputSchema = z.object({
  questions: z.array(TestQuestionSchema).describe('The array of generated questions.'),
  duration: z.number().describe('The duration of the test in minutes, passed through from input.'),
  language: z.enum(['english', 'hindi']).describe('The language of the test, passed through from input.'),
});
export type GenerateTestOutput = z.infer<typeof GenerateTestOutputSchema>;

export async function generateTestFlow(input: GenerateTestInput): Promise<GenerateTestOutput> {
  return await testGeneratorFlow(input);
}

const testGeneratorFlow = ai.defineFlow(
  {
    name: 'testGeneratorFlow',
    inputSchema: GenerateTestInputSchema,
    outputSchema: GenerateTestOutputSchema,
  },
  async (input) => {
    
    const prompt = `You are an expert test creator for students. Your task is to generate a multiple-choice quiz based on the provided topic.

    **Topic:** "${input.topic}"
    **Number of Questions:** ${input.numQuestions}
    **Language:** ${input.language}

    **Instructions:**
    1.  Generate exactly ${input.numQuestions} multiple-choice questions.
    2.  Each question must have exactly 4 options.
    3.  The entire output (questions, options, and answers) must be in the **${input.language}** language.
    4.  The 'answer' field for each question must be one of the strings from the 'options' array.
    5.  Ensure the questions are relevant to the topic and are at a standard competitive exam level.
    6.  Format the output as a valid JSON object matching the provided schema. Do not include any extra text or explanations outside the JSON structure.`;
    
    const testPrompt = ai.definePrompt({
        name: "testGeneratorPrompt",
        input: { schema: GenerateTestInputSchema },
        output: { schema: GenerateTestOutputSchema },
        prompt: prompt,
        config: {
          temperature: 0.5,
        }
    });

    const { output } = await testPrompt(input);

    if (!output) {
        throw new Error("AI did not return a valid JSON object with questions.");
    }
    
    return output;
  }
);
