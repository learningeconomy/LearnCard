import { youtube, type youtube_v3 } from '@googleapis/youtube';

import cache from '../../utils/cache';
import { getYouTubeConfig } from './youtubeConfig';

// Export types
export interface YouTubeVideo {
    videoId: string;
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnailUrl: string;
    url: string;
}

// Google API YouTube types
type Schema$SearchResult = youtube_v3.Schema$SearchResult;

// Normalize keyword for consistent caching
export const normalizeKeyword = (keyword: string): string => {
    return keyword.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Build cache key for a keyword
const buildCacheKey = (normalizedKeyword: string): string => {
    return `youtube:search:${normalizedKeyword}`;
};

// Build cache key for individual channel
const buildChannelCacheKey = (channelId: string, normalizedKeyword: string): string => {
    return `youtube:channel:${channelId}:${normalizedKeyword}`;
};

// Create YouTube client singleton
const getYouTubeClient = () => {
    const config = getYouTubeConfig();

    if (!config) throw new Error('YouTube API key is not configured');

    return youtube({
        version: 'v3',
        auth: config.apiKey,
    });
};

// Transform API response to our domain model
const transformSearchResults = (items: Schema$SearchResult[] | undefined): YouTubeVideo[] => {
    return (items || []).map(item => {
        const thumbnails = item.snippet?.thumbnails;
        const thumbnailUrl =
            thumbnails?.high?.url || thumbnails?.medium?.url || thumbnails?.default?.url || '';

        return {
            videoId: item.id?.videoId || '',
            title: item.snippet?.title || '',
            description: item.snippet?.description || '',
            channelTitle: item.snippet?.channelTitle || '',
            publishedAt: item.snippet?.publishedAt || '',
            thumbnailUrl,
            url: `https://www.youtube.com/watch?v=${item.id?.videoId || ''}`,
        };
    });
};

// Search a specific YouTube channel with per-channel caching
export const searchChannel = async (
    channelId: string,
    keyword: string,
    maxResults?: number,
    useCache: boolean = true
): Promise<YouTubeVideo[]> => {
    const config = getYouTubeConfig();

    if (!config) throw new Error('YouTube API key is not configured');

    const normalizedKeyword = normalizeKeyword(keyword);
    const cacheKey = buildChannelCacheKey(channelId, normalizedKeyword);

    // Check per-channel cache if enabled
    if (useCache && config.cacheChannelResults) {
        const cached = await cache.get(cacheKey);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch {
                // Invalid cache, continue to fetch
            }
        }
    }

    const client = getYouTubeClient();

    const response = await client.search.list({
        part: ['snippet'],
        type: ['video'],
        channelId,
        q: keyword,
        maxResults: maxResults ?? config.maxResultsPerChannel,
        order: 'relevance',
    });

    const videos = transformSearchResults(response.data.items);

    // Cache individual channel results
    if (useCache && config.cacheChannelResults) {
        await cache.set(cacheKey, JSON.stringify(videos), config.cacheTtl);
    }

    return videos;
};

// Remove duplicate videos by videoId
export const dedupeVideos = (videos: YouTubeVideo[]): YouTubeVideo[] => {
    const seen = new Set<string>();
    return videos.filter(video => {
        if (seen.has(video.videoId)) {
            return false;
        }
        seen.add(video.videoId);
        return true;
    });
};

// Calculate relevance score for a video
const calculateRelevanceScore = (video: YouTubeVideo, normalizedKeyword: string): number => {
    const keywords = normalizedKeyword.split(' ');
    let score = 0;

    const titleLower = video.title.toLowerCase();
    const descLower = video.description.toLowerCase();

    // Exact match in title (highest priority)
    if (titleLower.includes(normalizedKeyword)) {
        score += 100;
    }

    // All keywords present in title
    const allKeywordsInTitle = keywords.every(kw => titleLower.includes(kw));
    if (allKeywordsInTitle) {
        score += 50;
    }

    // Partial keyword matches in title
    keywords.forEach(kw => {
        if (titleLower.includes(kw)) {
            score += 10;
        }
    });

    // Exact match in description
    if (descLower.includes(normalizedKeyword)) {
        score += 30;
    }

    // Partial keyword matches in description
    keywords.forEach(kw => {
        if (descLower.includes(kw)) {
            score += 5;
        }
    });

    // Recency boost (more recent = higher score)
    // Published within last year gets a small boost
    const publishedDate = new Date(video.publishedAt);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (publishedDate > oneYearAgo) {
        score += 5;
    }

    return score;
};

// Rank videos by relevance to keyword
export const rankVideos = (videos: YouTubeVideo[], normalizedKeyword: string): YouTubeVideo[] => {
    return [...videos].sort((a, b) => {
        const scoreA = calculateRelevanceScore(a, normalizedKeyword);
        const scoreB = calculateRelevanceScore(b, normalizedKeyword);
        return scoreB - scoreA; // Higher score first
    });
};

// Internal: fetch and process results (used for stale-while-revalidate)
const fetchAndCacheResults = async (
    normalizedKeyword: string,
    cacheKey: string
): Promise<YouTubeVideo[]> => {
    const config = getYouTubeConfig();

    if (!config) {
        throw new Error('YouTube API key is not configured');
    }

    // Search all approved channels in parallel (per-channel caching enabled)
    const channelResults = await Promise.all(
        config.approvedChannels.map(channel =>
            searchChannel(channel.channelId, normalizedKeyword).catch(error => {
                console.error(`Error searching channel ${channel.name}:`, error.message);
                return [];
            })
        )
    );

    // Merge all results
    const merged = channelResults.flat();

    // Remove duplicates
    const deduped = dedupeVideos(merged);

    // Rank by relevance
    const ranked = rankVideos(deduped, normalizedKeyword);

    // Cache results (even if empty, to protect API quota)
    if (ranked.length > 0 || config.cacheEmptyResults) {
        await cache.set(cacheKey, JSON.stringify(ranked), config.cacheTtl);
    }

    return ranked;
};

// Search all approved channels with aggressive caching (stale-while-revalidate)
export const searchApprovedChannels = async (keyword: string): Promise<YouTubeVideo[]> => {
    const config = getYouTubeConfig();

    if (!config) {
        throw new Error('YouTube API key is not configured');
    }

    if (!keyword || !keyword.trim()) {
        throw new Error('Keyword is required');
    }

    const normalizedKeyword = normalizeKeyword(keyword);
    const cacheKey = buildCacheKey(normalizedKeyword);

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
        try {
            const parsed = JSON.parse(cached) as YouTubeVideo[];

            // Check TTL to decide if we should refresh in background
            const remainingTtl = (await cache.ttl(cacheKey)) ?? 0;

            // If within grace period, serve stale and refresh in background
            if (remainingTtl < config.cacheGracePeriod) {
                console.log(
                    `[YouTube] Serving stale cache for "${normalizedKeyword}" and refreshing in background`
                );
                // Fire and forget background refresh
                fetchAndCacheResults(normalizedKeyword, cacheKey).catch(error => {
                    console.error(
                        `[YouTube] Background refresh failed for "${normalizedKeyword}":`,
                        error.message
                    );
                });
            }

            return parsed;
        } catch {
            // Invalid cache, continue to fetch
        }
    }

    // No cache hit - fetch fresh results
    return fetchAndCacheResults(normalizedKeyword, cacheKey);
};

// Force refresh cache for a keyword (useful for admin/manual refresh)
export const refreshYouTubeCache = async (keyword: string): Promise<YouTubeVideo[]> => {
    if (!getYouTubeConfig()) {
        throw new Error('YouTube API key is not configured');
    }

    const normalizedKeyword = normalizeKeyword(keyword);
    const cacheKey = buildCacheKey(normalizedKeyword);

    console.log(`[YouTube] Force refreshing cache for "${normalizedKeyword}"`);
    return fetchAndCacheResults(normalizedKeyword, cacheKey);
};

// Clear YouTube cache for a specific keyword or all keywords
export const clearYouTubeCache = async (keyword?: string): Promise<void> => {
    const config = getYouTubeConfig();

    if (keyword) {
        const normalizedKeyword = normalizeKeyword(keyword);
        const cacheKey = buildCacheKey(normalizedKeyword);
        await cache.delete([cacheKey]);

        // Also clear per-channel caches
        if (config?.cacheChannelResults) {
            const channelKeys = config.approvedChannels.map(channel =>
                buildChannelCacheKey(channel.channelId, normalizedKeyword)
            );
            await cache.delete(channelKeys);
        }

        console.log(`[YouTube] Cleared cache for "${normalizedKeyword}"`);
    } else {
        // Clear all YouTube cache entries
        const allKeys = await cache.keys('youtube:*');
        if (allKeys && allKeys.length > 0) {
            await cache.delete(allKeys);
            console.log(`[YouTube] Cleared all cache entries (${allKeys.length})`);
        }
    }
};
