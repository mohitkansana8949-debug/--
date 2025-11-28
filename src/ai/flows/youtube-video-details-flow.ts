'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getYouTubeID } from '@/lib/youtube';

const VideoDetailsInputSchema = z.object({
  videoUrl: z.string().describe('The URL of the YouTube video.'),
});

export type VideoDetailsInput = z.infer<typeof VideoDetailsInputSchema>;

const VideoDetailsOutputSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelTitle: z.string(),
  thumbnailUrl: z.string(),
  scheduledStartTime: z.string(),
  liveChatId: z.string().optional(),
});

export type VideoDetailsOutput = z.infer<typeof VideoDetailsOutputSchema>;

export async function getYouTubeVideoDetails(input: VideoDetailsInput): Promise<VideoDetailsOutput> {
  return getYouTubeVideoDetailsFlow(input);
}

const getYouTubeVideoDetailsFlow = ai.defineFlow(
  {
    name: 'getYouTubeVideoDetailsFlow',
    inputSchema: VideoDetailsInputSchema,
    outputSchema: VideoDetailsOutputSchema,
  },
  async ({ videoUrl }) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error('YouTube API key is not configured.');
    }

    const videoId = getYouTubeID(videoUrl);
    if (!videoId) {
      throw new Error('अमान्य यूट्यूब वीडियो URL।');
    }

    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || data.items.length === 0) {
        throw new Error(data.error?.message || 'Failed to fetch video details from YouTube.');
      }

      const item = data.items[0];
      const snippet = item.snippet;
      const liveStreamingDetails = item.liveStreamingDetails;

      if (!snippet) {
         throw new Error('इस वीडियो के लिए कोई जानकारी नहीं मिली।');
      }

      // For a scheduled live stream, scheduledStartTime is available.
      // For a completed live stream or regular video, use publishTime.
      const scheduledStartTime = liveStreamingDetails?.scheduledStartTime || snippet.publishedAt;
      if (!scheduledStartTime) {
          throw new Error('वीडियो की प्रकाशन या शेड्यूल समय नहीं मिल सका।');
      }

      return {
        videoId: videoId,
        title: snippet.title,
        channelTitle: snippet.channelTitle,
        thumbnailUrl: snippet.thumbnails.high.url,
        scheduledStartTime: scheduledStartTime,
        liveChatId: liveStreamingDetails?.activeLiveChatId,
      };
    } catch (error) {
      console.error('Error in YouTube video details flow:', error);
      throw error;
    }
  }
);
