
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {config} from 'dotenv';
config();

const youtubeApiKey = process.env.YOUTUBE_API_KEY || '';

const SearchInputSchema = z.object({
  query: z.string().describe('The search query for YouTube'),
  channelId: z.string().nullable().describe('Optional channel ID to filter search results'),
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

async function searchYouTube(query: string, channelId: string | null) {
  if (!youtubeApiKey) {
    throw new Error('YOUTUBE_API_KEY is not set in the environment variables.');
  }

  let channels: z.infer<typeof ChannelSchema>[] = [];
  let videos: z.infer<typeof VideoSchema>[] = [];

  // If a channelId is provided, we fetch all videos from that channel.
  if (channelId) {
     const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${youtubeApiKey}`;
     const channelDetailsResponse = await fetch(channelDetailsUrl);
     const channelDetailsData = await channelDetailsResponse.json();

     if (channelDetailsData.error || !channelDetailsData.items || channelDetailsData.items.length === 0) {
        console.error('YouTube Channel Details API Error:', channelDetailsData.error);
        throw new Error(channelDetailsData.error?.message || 'Could not find channel details.');
     }
     
     const channelSnippet = channelDetailsData.items[0].snippet;
     const uploadsPlaylistId = channelDetailsData.items[0].contentDetails.relatedPlaylists.uploads;

     // Fetch videos from the uploads playlist
     const searchUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${youtubeApiKey}`;
     const searchResponse = await fetch(searchUrl);
     const searchData = await searchResponse.json();
     
     if (searchData.error) {
       console.error('YouTube API Error:', searchData.error);
       throw new Error(searchData.error.message);
     }

     videos = searchData.items.map((item: any) => ({
       videoId: item.snippet.resourceId.videoId,
       title: item.snippet.title,
       description: item.snippet.description,
       thumbnailUrl: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
       channelTitle: channelSnippet.title,
       channelId: item.snippet.channelId,
     }));

  } else {
    // If no channelId, search for channels based on the query.
    const channelSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=10&key=${youtubeApiKey}`;
    const channelSearchResponse = await fetch(channelSearchUrl);
    const channelSearchData = await channelSearchResponse.json();

    if (channelSearchData.error) {
      console.error('YouTube Channel API Error:', channelSearchData.error);
      throw new Error(channelSearchData.error.message);
    }

    const foundChannelIds = channelSearchData.items.map((item: any) => item.id.channelId).join(',');
    
    if (foundChannelIds) {
      const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${foundChannelIds}&key=${youtubeApiKey}`;
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
  }

  return { channels, videos };
}

export const youtubeSearchFlow = ai.defineFlow(
  {
    name: 'youtubeSearchFlow',
    inputSchema: SearchInputSchema,
    outputSchema: SearchOutputSchema,
  },
  async ({ query, channelId }) => {
    return await searchYouTube(query, channelId);
  }
);
