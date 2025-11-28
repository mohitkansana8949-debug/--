'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';


const ChannelEventsInputSchema = z.object({
  channelId: z.string().describe('The ID of the YouTube channel.'),
});

export type ChannelEventsInput = z.infer<typeof ChannelEventsInputSchema>;

export type UpcomingLiveStream = {
  id: string;
  title: string;
  thumbnailUrl: string;
  scheduledStartTime: string; 
};

const ChannelEventsOutputSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    thumbnailUrl: z.string(),
    scheduledStartTime: z.string(),
  })
);

export type ChannelEventsOutput = z.infer<typeof ChannelEventsOutputSchema>;

export async function getUpcomingChannelEvents(input: ChannelEventsInput): Promise<ChannelEventsOutput> {
  return getUpcomingChannelEventsFlow(input);
}


const getUpcomingChannelEventsFlow = ai.defineFlow(
  {
    name: 'getUpcomingChannelEventsFlow',
    inputSchema: ChannelEventsInputSchema,
    outputSchema: ChannelEventsOutputSchema,
  },
  async ({ channelId }) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key is not configured.');
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&eventType=upcoming&type=video&key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch upcoming events from YouTube.');
      }
      
      const upcomingEvents: UpcomingLiveStream[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        scheduledStartTime: item.snippet.liveBroadcastContent === 'upcoming' ? item.snippet.publishTime : new Date().toISOString(),
      }));

      return upcomingEvents;
    } catch (error) {
      console.error('Error in YouTube channel events flow:', error);
      throw error;
    }
  }
);
