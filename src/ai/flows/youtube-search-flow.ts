
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import getConfig from 'next/config';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig();
const youtubeApiKey = serverRuntimeConfig.YOUTUBE_API_KEY || publicRuntimeConfig.YOUTUBE_API_KEY;

const QUICKLY_STUDY_CHANNEL_ID = 'UCF2s8P3t1-x9-g_X0d-jC-g';

const SearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube'),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

const VideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string(),
  channelTitle: z.string(),
  channelId: z.string(),
});

const SearchOutputSchema = z.object({
  videos: z.array(VideoSchema),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;

async function searchYouTube(query: string) {
  if (!youtubeApiKey) {
    console.error('YOUTUBE_API_KEY is not set in the environment variables.');
    throw new Error('The YouTube API key is not configured. Please contact the administrator.');
  }

  // Check if the query is for "Quickly Study" and scope the search to the specific channel
  const isQuicklyStudySearch = /quickly\s*study/i.test(query);
  const channelIdParam = isQuicklyStudySearch ? `&channelId=${QUICKLY_STUDY_CHANNEL_ID}` : '';
  const finalQuery = isQuicklyStudySearch ? 'Quickly Study' : query; // Use a clean query for the channel search

  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(finalQuery)}&type=video&maxResults=20${channelIdParam}&key=${youtubeApiKey}`;
  
  const response = await fetch(searchUrl);
  const data = await response.json();

  if (data.error) {
    console.error('YouTube API Error:', data.error);
    throw new Error(data.error.message);
  }

  const videos: z.infer<typeof VideoSchema>[] = data.items
    ? data.items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
      }))
    : [];

  return { videos };
}

export async function youtubeSearchFlow(input: SearchInput): Promise<SearchOutput> {
  const { query } = input;
  return await searchYouTube(query);
}
