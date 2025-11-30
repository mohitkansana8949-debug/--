
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import getConfig from 'next/config';

// This flow is now deprecated and should not be used for the main UI.
// It is kept for potential future admin tasks or one-off data fetching.
// The main YouTube page now uses a static, hardcoded list of videos
// from src/lib/youtube-videos.json to prevent API quota exhaustion.

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig() || {};
const youtubeApiKey = serverRuntimeConfig?.YOUTUBE_API_KEY || publicRuntimeConfig?.YOUTUBE_API_KEY;

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

async function searchYouTube({ query }: SearchInput): Promise<SearchOutput> {
  if (!youtubeApiKey) {
    const errorMessage = 'YOUTUBE_API_KEY is not set in the environment variables.';
    console.error(errorMessage);
    // Avoid throwing an error that crashes the app, return empty instead.
    return { videos: [] };
  }

  // Always search within the Quickly Study channel
  const videoSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${QUICKLY_STUDY_CHANNEL_ID}&maxResults=50&key=${youtubeApiKey}&q=${encodeURIComponent(query || '')}&type=video`;

  try {
    const videoData = await fetch(videoSearchUrl).then(res => res.json());
    
    if (videoData.error) {
      console.error('YouTube API Error (Videos):', videoData.error.message);
       // Avoid throwing an error that crashes the app, return empty instead.
      return { videos: [] };
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

    return { videos };
  } catch (err) {
      console.error("Failed to fetch from YouTube API", err);
      return { videos: [] };
  }
}

export const youtubeSearchFlow = ai.defineFlow(
  {
    name: 'youtubeSearchFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  searchYouTube
);
