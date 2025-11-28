
// Helper function to extract YouTube Video ID from any URL format
export const getYouTubeID = (url: string): string | null => {
  if (!url) return null;

  let ID = '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      ID = urlObj.pathname.substring(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      if (urlObj.pathname === '/watch') {
        ID = urlObj.searchParams.get('v') || '';
      } else if (urlObj.pathname.startsWith('/live/')) {
        ID = urlObj.pathname.split('/live/')[1].split('?')[0];
      } else if (urlObj.pathname.startsWith('/embed/')) {
        ID = urlObj.pathname.split('/embed/')[1];
      }
    }
    
    // Remove any extra query parameters from the ID
    if (ID.includes('?')) {
        ID = ID.split('?')[0];
    }
    return ID || null;

  } catch (e) {
     // Fallback for non-URL strings or invalid formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|live\/|v\/|)([\w-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
  }
  
  return null;
}


export const getLiveChatId = async (videoId: string, apiKey: string): Promise<string> => {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const liveChatId = data.items[0].liveStreamingDetails?.activeLiveChatId;
            if (liveChatId) {
                return liveChatId;
            } else {
                throw new Error("इस वीडियो के लिए लाइव चैट सक्षम नहीं है या स्ट्रीम अभी शुरू नहीं हुई है।");
            }
        } else {
            throw new Error("वीडियो नहीं मिला या यह एक लाइव वीडियो नहीं है।");
        }
    } catch (error) {
        console.error('Failed to fetch live chat ID:', error);
        throw error;
    }
}
