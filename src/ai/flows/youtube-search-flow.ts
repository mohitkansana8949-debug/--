
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube videos.'),
});

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
};

const SearchOutputSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    thumbnailUrl: z.string(),
    channelTitle: z.string(),
  })
);

export async function searchVideos(input: z.infer<typeof SearchInputSchema>): Promise<z.infer<typeof SearchOutputSchema>> {
    return searchVideosFlow(input);
}


const searchVideosFlow = ai.defineFlow(
  {
    name: 'searchVideosFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  async ({ query }) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key is not configured.');
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&key=${apiKey}&type=video&maxResults=20`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch videos from YouTube.');
      }

      const videos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        channelTitle: item.snippet.channelTitle,
      }));

      return videos;
    } catch (error) {
      console.error('Error in YouTube search flow:', error);
      throw error;
    }
  }
);
