
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import getConfig from 'next/config';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig() || {};
const youtubeApiKey = serverRuntimeConfig?.YOUTUBE_API_KEY || publicRuntimeConfig?.YOUTUBE_API_KEY;

const QUICKLY_STUDY_CHANNEL_ID = 'UCF2s8P3t1-x9-g_X0d-jC-g';

const SearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube'),
  channelId: z.string().nullable().describe('Optional: A specific channel ID to search within'),
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

const ChannelSchema = z.object({
  channelId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string(),
});

const SearchOutputSchema = z.object({
  videos: z.array(VideoSchema),
  channels: z.array(ChannelSchema),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;

async function searchYouTube({ query, channelId }: SearchInput): Promise<SearchOutput> {
  if (!youtubeApiKey) {
    console.error('YOUTUBE_API_KEY is not set in the environment variables.');
    throw new Error('The YouTube API key is not configured. Please contact the administrator.');
  }
  
  const isQuicklyStudySearch = /quickly\s*study/i.test(query);

  let videoSearchUrl = '';
  let channelSearchUrl = '';
  
  if (channelId) {
     videoSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&key=${youtubeApiKey}&q=${encodeURIComponent(query || '')}&type=video`;
  } else if (isQuicklyStudySearch) {
    // If "Quickly Study" is searched, prioritize finding the channel and its videos
    videoSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${QUICKLY_STUDY_CHANNEL_ID}&maxResults=20&key=${youtubeApiKey}&q=${encodeURIComponent(query.replace(/quickly\s*study/i, '').trim())}&type=video`;
    channelSearchUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${QUICKLY_STUDY_CHANNEL_ID}&key=${youtubeApiKey}`;
  } else {
    videoSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${youtubeApiKey}`;
    channelSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=5&key=${youtubeApiKey}`;
  }


  const videoPromise = fetch(videoSearchUrl).then(res => res.json());
  const channelPromise = channelSearchUrl ? fetch(channelSearchUrl).then(res => res.json()) : Promise.resolve({ items: [] });
  
  const [videoData, channelData] = await Promise.all([videoPromise, channelPromise]);

  if (videoData.error) {
    console.error('YouTube API Error (Videos):', videoData.error.message);
    throw new Error(videoData.error.message);
  }
  if (channelData.error) {
    console.error('YouTube API Error (Channels):', channelData.error.message);
    // Don't throw for channel error, video search might have succeeded
  }

  const videos: z.infer<typeof VideoSchema>[] = videoData.items
    ? videoData.items.filter((item: any) => item.id.videoId).map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
      }))
    : [];

  const channels: z.infer<typeof ChannelSchema>[] = channelData.items
    ? channelData.items.map((item: any) => ({
        channelId: item.id.channelId || item.id, // Handles both search and channels list response
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
    })) : [];

  return { videos, channels };
}

export const youtubeSearchFlow = ai.defineFlow(
  {
    name: 'youtubeSearchFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  searchYouTube
);
