// YouTube API configuration
export const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
export const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Cache TTL in seconds (24 hours - aggressive caching to protect API quota)
export const YOUTUBE_CACHE_TTL = 24 * 60 * 60;

// Grace period for stale cache (serve stale while refreshing in background)
export const YOUTUBE_CACHE_GRACE_PERIOD = 60 * 60; // 1 hour

// Cache empty results to avoid repeated API calls for keywords with no results
export const YOUTUBE_CACHE_EMPTY_RESULTS = true;

// Max results per channel search
export const YOUTUBE_MAX_RESULTS_PER_CHANNEL = 10;

// Cache individual channel results separately (allows partial cache hits)
export const YOUTUBE_CACHE_CHANNEL_RESULTS = true;

// Approved YouTube channels for search
// Channel IDs are resolved from handles and stored statically
export const APPROVED_YOUTUBE_CHANNELS = [
    {
        name: 'TED',
        handle: '@TED',
        handleUrl: 'https://www.youtube.com/@TED',
        // TED channel ID - resolved from handle
        channelId: 'UCAuUUnT6oDeKwE6v1NGQxug',
    },
    {
        name: 'TEDx',
        handle: '@TEDx',
        handleUrl: 'https://www.youtube.com/@TEDx',
        // TEDx channel ID - resolved from handle
        channelId: 'UCsT0YIqwnpJCM-mx7-gSA4Q',
    },
] as const;

// Validate that channel IDs are configured
if (!YOUTUBE_API_KEY) {
    console.warn('YOUTUBE_API_KEY is not set. YouTube search functionality will be unavailable.');
}
