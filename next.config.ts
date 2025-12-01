
import type {NextConfig} from 'next';
import createNextPwa from '@ducanh2912/next-pwa';

const withPWA = createNextPwa({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheStartUrl: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  extendDefaultRuntimeCaching: true,
  fallbacks: {
    document: "/_offline",
  },
  customWorkerSrc: "src/worker",
  appStartUrl: "/",
  pwa: {
    "name": "Quickly Study",
    "short_name": "QuicklyStudy",
    "description": "The quickest way to study. The Quickest way of Study",
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#090E23",
    "theme_color": "#090E23",
    "icons": [
      {
        "src": "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any"
      },
      {
        "src": "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "maskable"
      },
      {
        "src": "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "maskable"
      }
    ],
    "splash_pages": [
      {
        "src": "https://i.supaimg.com/666f0c51-e68b-44ff-93fe-f7366ef31930.jpg",
        "sizes": "1125x2436",
        "type": "image/jpeg",
        "media": "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
      },
      {
        "src": "https://i.supaimg.com/666f0c51-e68b-44ff-93fe-f7366ef31930.jpg",
        "sizes": "1242x2688",
        "type": "image/jpeg",
        "media": "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
      },
      {
        "src": "https://i.supaimg.com/666f0c51-e68b-44ff-93fe-f7366ef31930.jpg",
        "sizes": "828x1792",
        "type": "image/jpeg",
        "media": "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        "src": "https://i.supaimg.com/666f0c51-e68b-44ff-93fe-f7366ef31930.jpg",
        "sizes": "1242x2208",
        "type": "image/jpeg",
        "media": "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
      },
      {
        "src": "https://i.supaimg.com/666f0c51-e68b-44ff-93fe-f7366ef31930.jpg",
        "sizes": "750x1334",
        "type": "image/jpeg",
        "media": "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
      },
      {
        "src": "https://i.supaimg.com/666f0c51-e68b-44ff-93fe-f7366ef31930.jpg",
        "sizes": "640x1136",
        "type": "image/jpeg",
        "media": "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
      }
    ]
  }
});


const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.supaimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  env: {
    NEXT_PUBLIC_YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
    NEXT_PUBLIC_VAPID_KEY: process.env.NEXT_PUBLIC_VAPID_KEY,
  },
  publicRuntimeConfig: {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  },
  serverRuntimeConfig: {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  },
};

export default withPWA(nextConfig);
