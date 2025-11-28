import { config } from 'dotenv';
config();

if (!process.env.YOUTUBE_API_KEY) {
    process.env.YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
}
