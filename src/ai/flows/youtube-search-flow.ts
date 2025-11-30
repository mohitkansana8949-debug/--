
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import getConfig from 'next/config';

const { serverRuntimeConfig, publicRuntimeConfig } = getConfig() || {};

const SearchInputSchema = z.object({
  channelId: z.string().describe('The ID of the YouTube channel to search'),
});
export type SearchInput = z.infer<typeof SearchInputSchema>;

const VideoSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string(),
});

const ChannelInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string(),
});

const SearchOutputSchema = z.object({
  channel: ChannelInfoSchema,
  videos: z.array(VideoSchema),
});
export type SearchOutput = z.infer<typeof SearchOutputSchema>;

async function fetchAllChannelVideos(channelId: string, apiKey: string, pageToken = ''): Promise<any[]> {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&key=${apiKey}&type=video&pageToken=${pageToken}`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    if (data.error) {
        console.error('YouTube API Error (Video Search):', data.error.message);
        throw new Error(data.error.message);
    }
    
    let videos = data.items || [];
    
    // Check for nextPageToken to decide if we need to fetch more videos.
    // This is commented out to prevent excessive API usage.
    // You can enable this if you need to fetch more than 50 videos.
    // if (data.nextPageToken) {
    //     const nextPageVideos = await fetchAllChannelVideos(channelId, apiKey, data.nextPageToken);
    //     videos = videos.concat(nextPageVideos);
    // }

    return videos;
}


async function searchAndSyncYouTube({ channelId }: SearchInput): Promise<SearchOutput> {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeApiKey) {
    throw new Error('YOUTUBE_API_KEY is not set in the environment variables.');
  }

  // 1. Fetch Channel Details
  const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${youtubeApiKey}`;
  const channelDetailsResponse = await fetch(channelDetailsUrl).then(res => res.json());

  if (channelDetailsResponse.error) {
      console.error('YouTube API Error (Channel Details):', channelDetailsResponse.error.message);
      throw new Error(channelDetailsResponse.error.message);
  }

  if (!channelDetailsResponse.items || channelDetailsResponse.items.length === 0) {
    throw new Error('YouTube channel not found.');
  }

  const channelSnippet = channelDetailsResponse.items[0].snippet;
  const channelInfo: z.infer<typeof ChannelInfoSchema> = {
      id: channelId,
      title: channelSnippet.title,
      description: channelSnippet.description,
      thumbnailUrl: channelSnippet.thumbnails.high?.url || channelSnippet.thumbnails.default.url,
  };


  // 2. Fetch all videos from the channel's uploads playlist
  const uploadsPlaylistId = channelDetailsResponse.items[0].contentDetails.relatedPlaylists.uploads;
  const allVideoItems = await fetchAllChannelVideos(channelId, youtubeApiKey); // Re-using existing function, which searches channel, not playlist.
  
  const videos: z.infer<typeof VideoSchema>[] = allVideoItems
    .filter((item: any) => item.id.videoId)
    .map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
    }));

  return { 
    channel: channelInfo,
    videos: videos 
  };
}

export const youtubeSyncFlow = ai.defineFlow(
  {
    name: 'youtubeSyncFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  searchAndSyncYouTube
);
