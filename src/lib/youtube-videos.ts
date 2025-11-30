
import data from './youtube-videos.json';

export type VideoCategory = "Sainik School" | "Military School" | "Maths" | "GK";

export type YoutubeVideo = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  category: VideoCategory;
};

export const allYoutubeVideos: YoutubeVideo[] = data.videos;
