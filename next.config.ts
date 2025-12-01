
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
  manifest: {
    name: "Quickly Study",
    short_name: "QuicklyStudy",
    description: "The quickest way to study.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#090E23",
    theme_color: "#090E23",
    icons: [
      {
        src: "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
       {
        src: "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
       {
        src: "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  },
  // The old webpack-specific config is removed.
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
