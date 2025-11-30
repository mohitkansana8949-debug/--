
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
  
  let searchUrl = '';
  if (isQuicklyStudySearch) {
    // Search specifically within the Quickly Study channel
    searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${QUICKLY_STUDY_CHANNEL_ID}&maxResults=20&key=${youtubeApiKey}`;
    if (query.trim().toLowerCase() !== 'quickly study') {
      // If there's more to the query, use it
      searchUrl += `&q=${encodeURIComponent(query)}`;
    }
  } else {
    // General search across YouTube
    searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${youtubeApiKey}`;
  }
  
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

// New flow to get videos from our channel and others
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
