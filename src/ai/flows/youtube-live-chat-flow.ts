'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const LiveChatInputSchema = z.object({
  liveChatId: z.string().describe('The ID of the YouTube live chat.'),
  nextPageToken: z.string().optional().describe('The token for the next page of results.'),
});

export type LiveChatInput = z.infer<typeof LiveChatInputSchema>;

export type LiveChatMessage = {
  id: string;
  authorName: string;
  authorPhotoUrl: string;
  messageText: string;
  publishedAt: string;
};

const LiveChatOutputSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      authorName: z.string(),
      authorPhotoUrl: z.string(),
      messageText: z.string(),
      publishedAt: z.string(),
    })
  ),
  nextPageToken: z.string().optional(),
  pollingIntervalMillis: z.number(),
});

export type LiveChatOutput = z.infer<typeof LiveChatOutputSchema>;


export async function getLiveChatMessages(input: LiveChatInput): Promise<LiveChatOutput> {
  return getLiveChatMessagesFlow(input);
}


const getLiveChatMessagesFlow = ai.defineFlow(
  {
    name: 'getLiveChatMessagesFlow',
    inputSchema: LiveChatInputSchema,
    outputSchema: LiveChatOutputSchema,
  },
  async ({ liveChatId, nextPageToken }) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key is not configured.');
    }

    let url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${liveChatId}&part=snippet,authorDetails&key=${apiKey}`;
    if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        const errorReason = data.error?.errors?.[0]?.reason;
        // Gracefully handle cases where the chat has ended or the token is invalid
        if (errorReason === 'chatDisabled' || errorReason === 'liveChatEnded' || errorReason === 'pageTokenNotValid' ) {
            return {
                messages: [],
                pollingIntervalMillis: 120000, // Stop polling frequently
            };
        }
        throw new Error(data.error?.message || 'Failed to fetch live chat messages.');
      }
      
      const messages: LiveChatMessage[] = data.items.map((item: any) => ({
        id: item.id,
        authorName: item.authorDetails.displayName,
        authorPhotoUrl: item.authorDetails.profileImageUrl,
        messageText: item.snippet.displayMessage,
        publishedAt: item.snippet.publishedAt,
      }));

      return {
        messages,
        nextPageToken: data.nextPageToken,
        pollingIntervalMillis: data.pollingIntervalMillis,
      };

    } catch (error) {
      console.error('Error in YouTube live chat flow:', error);
      throw error;
    }
  }
);
