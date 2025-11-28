'use client';

import { cn } from "@/lib/utils";

type JioVideoPlayerProps = {
    videoUrl: string;
};

// This function extracts the core part of the JioCloud URL needed for the embed.
const getJioEmbedUrl = (url: string): string | null => {
    try {
        const urlObj = new URL(url);
        // The unique video identifier is in the 'u' query parameter.
        const videoId = urlObj.searchParams.get('u');
        if (videoId) {
            // Construct the embeddable URL format for JioCloud.
            return `https://www.jioaicloud.com/embed/?u=${videoId}&autoplay=1`;
        }
    } catch (e) {
        console.error("Invalid JioCloud URL", e);
    }
    return null;
}

export default function JioVideoPlayer({ videoUrl }: JioVideoPlayerProps) {
    const embedUrl = getJioEmbedUrl(videoUrl);

    if (!embedUrl) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center text-white">
                Invalid JioCloud Video Link
            </div>
        );
    }

    return (
        <iframe
            src={embedUrl}
            className={cn("w-full h-full border-0")}
            allow="autoplay; fullscreen"
            allowFullScreen
            title="JioCloud Video Player"
        ></iframe>
    );
}
