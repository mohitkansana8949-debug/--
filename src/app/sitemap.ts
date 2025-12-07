
import { MetadataRoute } from 'next'
import { collection, getDocs, query } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const APP_URL = 'https://your-app-url.com'; // Replace with your actual app URL

type SitemapEntry = {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

async function generateDynamicSitemaps() {
    const { firestore } = initializeFirebase();
    const sitemapEntries: SitemapEntry[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Collections to fetch for dynamic routes
    const collectionsToFetch = ['courses', 'ebooks', 'pyqs', 'tests', 'books'];

    for (const collectionName of collectionsToFetch) {
        try {
            const q = query(collection(firestore, collectionName));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                sitemapEntries.push({
                    url: `${APP_URL}/${collectionName}/${doc.id}`,
                    lastModified: today,
                    changeFrequency: 'weekly',
                    priority: 0.8,
                });
            });
        } catch (error) {
            console.error(`Error fetching ${collectionName}:`, error);
        }
    }
    
    return sitemapEntries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date().toISOString().split('T')[0];

  const staticRoutes: SitemapEntry[] = [
    { url: `${APP_URL}/`, lastModified: today, changeFrequency: 'daily', priority: 1.0 },
    { url: `${APP_URL}/courses`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/ebooks`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/pyqs`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/test-series`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/bookshala`, lastModified: today, changeFrequency: 'daily', priority: 0.9 },
    { url: `${APP_URL}/feed`, lastModified: today, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${APP_URL}/refer`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/support`, lastModified: today, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/login`, lastModified: today, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${APP_URL}/signup`, lastModified: today, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${APP_URL}/ai-doubt-solver`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/ai-test`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${APP_URL}/ai-trick-generator`, lastModified: today, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const dynamicRoutes = await generateDynamicSitemaps();

  return [...staticRoutes, ...dynamicRoutes];
}
