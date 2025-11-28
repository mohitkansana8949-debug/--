import { config } from 'dotenv';
config();

if (!process.env.YOUTUBE_API_KEY) {
    process.env.YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
}

if (!process.env.B2_KEY_ID) {
    console.warn("B2_KEY_ID is not set in .env file");
}
if (!process.env.B2_APPLICATION_KEY) {
    console.warn("B2_APPLICATION_KEY is not set in .env file");
}
