
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {config} from 'dotenv';
config();

const youtubeApiKey = process.env.YOUTUBE_API_KEY || '';

const SearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube'),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

const ChannelSchema = z.object({
  channelId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string(),
  subscriberCount: z.string().optional(),
});

const VideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string(),
  channelTitle: z.string(),
  channelId: z.string(),
});

const SearchOutputSchema = z.object({
  channels: z.array(ChannelSchema),
  videos: z.array(VideoSchema),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;

async function searchYouTube(query: string) {
  if (!youtubeApiKey) {
    throw new Error('YOUTUBE_API_KEY is not set in the environment variables.');
  }

  // Search for channels
  const channelSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=10&key=${youtubeApiKey}`;
  const channelSearchResponse = await fetch(channelSearchUrl);
  const channelSearchData = await channelSearchResponse.json();

  if (channelSearchData.error) {
    console.error('YouTube Channel API Error:', channelSearchData.error);
    throw new Error(channelSearchData.error.message);
  }

  const channelIds = channelSearchData.items.map((item: any) => item.id.channelId).join(',');
  
  let channels: z.infer<typeof ChannelSchema>[] = [];

  if (channelIds) {
    const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${youtubeApiKey}`;
    const channelDetailsResponse = await fetch(channelDetailsUrl);
    const channelDetailsData = await channelDetailsResponse.json();

     if (channelDetailsData.error) {
        console.error('YouTube Channel Details API Error:', channelDetailsData.error);
        throw new Error(channelDetailsData.error.message);
    }
    
    channels = channelDetailsData.items.map((item: any) => ({
      channelId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      subscriberCount: item.statistics.subscriberCount,
    }));
  }

  // Search for videos
  const videoSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${youtubeApiKey}`;
  const videoSearchResponse = await fetch(videoSearchUrl);
  const videoSearchData = await videoSearchResponse.json();

  if (videoSearchData.error) {
    console.error('YouTube Video API Error:', videoSearchData.error);
    throw new Error(videoSearchData.error.message);
  }

  const videos: z.infer<typeof VideoSchema>[] = videoSearchData.items.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
  }));

  return { channels, videos };
}


export const youtubeSearchFlow = ai.defineFlow(
  {
    name: 'youtubeSearchFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  async ({ query }) => {
    return await searchYouTube(query);
  }
);
