
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

async function searchYouTube({ query, channelId }: SearchInput) {
  if (!youtubeApiKey) {
    console.error('YOUTUBE_API_KEY is not set in the environment variables.');
    throw new Error('The YouTube API key is not configured. Please contact the administrator.');
  }

  const isQuicklyStudySearch = /quickly\s*study/i.test(query);

  let videoSearchUrl = '';
  let channelSearchUrl = '';

  if (channelId) {
     videoSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&key=${youtubeApiKey}&q=${encodeURIComponent(query || '')}`;
  } else if (isQuicklyStudySearch) {
    videoSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${QUICKLY_STUDY_CHANNEL_ID}&maxResults=50&key=${youtubeApiKey}&q=${encodeURIComponent(query)}`;
    channelSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=1&key=${youtubeApiKey}`;
  } else {
    videoSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${youtubeApiKey}`;
    channelSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=5&key=${youtubeApiKey}`;
  }

  const videoPromise = fetch(videoSearchUrl).then(res => res.json());
  const channelPromise = channelSearchUrl ? fetch(channelSearchUrl).then(res => res.json()) : Promise.resolve({ items: [] });
  
  const [videoData, channelData] = await Promise.all([videoPromise, channelPromise]);

  if (videoData.error) {
    console.error('YouTube API Error (Videos):', videoData.error);
    throw new Error(videoData.error.message);
  }
  if (channelData.error) {
    console.error('YouTube API Error (Channels):', channelData.error);
    // Don't throw, just log, as video search might have succeeded
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
        channelId: item.snippet.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
    })) : [];

  return { videos, channels };
}

export async function youtubeSearchFlow(input: SearchInput): Promise<SearchOutput> {
  return await searchYouTube(input);
}

const HomePageVideosSchema = z.object({});
export type HomePageVideosInput = z.infer<typeof HomePageVideosSchema>;

const HomePageVideosOutputSchema = z.object({
  quicklyStudyVideos: z.array(VideoSchema),
  otherVideos: z.array(VideoSchema),
});
export type HomePageVideosOutput = z.infer<typeof HomePageVideosOutputSchema>;

export async function getHomePageVideos(input: HomePageVideosInput): Promise<HomePageVideosOutput> {
  if (!youtubeApiKey) {
    throw new Error('The YouTube API key is not configured.');
  }

  // Fetch videos from Quickly Study channel
  const quicklyStudyUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${QUICKLY_STUDY_CHANNEL_ID}&maxResults=3&order=date&type=video&key=${youtubeApiKey}`;
  const qsResponse = await fetch(quicklyStudyUrl);
  const qsData = await qsResponse.json();
  const quicklyStudyVideos = qsData.items?.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
  })) || [];

  // Fetch general educational videos
  const generalQuery = 'Sainik School, Military School, Navodaya Vidyalaya';
  const generalUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(generalQuery)}&type=video&maxResults=20&key=${youtubeApiKey}`;
  const generalResponse = await fetch(generalUrl);
  const generalData = await generalResponse.json();
  const otherVideos = generalData.items?.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
    channelTitle: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
  })) || [];

  return {
    quicklyStudyVideos,
    otherVideos,
  };
}
