'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// =================== VIDEO SEARCH ===================

const VideoSearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube videos.'),
  channelId: z.string().optional().describe('Optional: ID of the channel to search within.')
});

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
};

const VideoSearchOutputSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    thumbnailUrl: z.string(),
    channelTitle: z.string(),
  })
);

export async function searchVideos(input: z.infer<typeof VideoSearchInputSchema>): Promise<z.infer<typeof VideoSearchOutputSchema>> {
    return searchVideosFlow(input);
}

const searchVideosFlow = ai.defineFlow(
  {
    name: 'searchVideosFlow',
    inputSchema: VideoSearchInputSchema,
    outputSchema: VideoSearchOutputSchema,
  },
  async ({ query, channelId }) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key is not configured.');
    }

    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
      query
    )}&key=${apiKey}&type=video&maxResults=50`;

    if (channelId) {
        url += `&channelId=${channelId}`;
    }

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
      console.error('Error in YouTube video search flow:', error);
      throw error;
    }
  }
);


// =================== CHANNEL SEARCH ===================

const ChannelSearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube channels.'),
});

export type YouTubeChannel = {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: string;
};

const ChannelSearchOutputSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    thumbnailUrl: z.string(),
    subscriberCount: z.string(),
  })
);


export async function searchChannels(input: z.infer<typeof ChannelSearchInputSchema>): Promise<z.infer<typeof ChannelSearchOutputSchema>> {
    return searchChannelsFlow(input);
}

const searchChannelsFlow = ai.defineFlow(
  {
    name: 'searchChannelsFlow',
    inputSchema: ChannelSearchInputSchema,
    outputSchema: ChannelSearchOutputSchema,
  },
  async ({ query }) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key is not configured.');
    }
    
    // 1. Search for channels to get Channel IDs
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&key=${apiKey}&type=channel&maxResults=10`;
    
    let channelIds: string[] = [];
    try {
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchResponse.ok) {
        throw new Error(searchData.error?.message || 'Failed to search for channels.');
      }
      channelIds = searchData.items.map((item: any) => item.id.channelId);

      if (channelIds.length === 0) {
        return [];
      }

    } catch (error) {
      console.error('Error in YouTube channel search flow (step 1):', error);
      throw error;
    }

    // 2. Get details (like subscriber count) for the found Channel IDs
    const detailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds.join(',')}&key=${apiKey}`;
    try {
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (!detailsResponse.ok) {
          throw new Error(detailsData.error?.message || 'Failed to fetch channel details.');
      }
      
      const channels: YouTubeChannel[] = detailsData.items.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        subscriberCount: item.statistics.subscriberCount
      }));

      return channels;

    } catch (error) {
      console.error('Error in YouTube channel search flow (step 2):', error);
      throw error;
    }
  }
);
