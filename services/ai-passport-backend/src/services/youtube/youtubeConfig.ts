import {
    APPROVED_YOUTUBE_CHANNELS,
    YOUTUBE_API_KEY,
    YOUTUBE_CACHE_CHANNEL_RESULTS,
    YOUTUBE_CACHE_EMPTY_RESULTS,
    YOUTUBE_CACHE_GRACE_PERIOD,
    YOUTUBE_CACHE_TTL,
    YOUTUBE_MAX_RESULTS_PER_CHANNEL,
} from '../../constants/youtube';

export type YouTubeConfig = {
    apiKey: string;
    cacheTtl: number;
    cacheGracePeriod: number;
    cacheEmptyResults: boolean;
    cacheChannelResults: boolean;
    maxResultsPerChannel: number;
    approvedChannels: typeof APPROVED_YOUTUBE_CHANNELS;
};

export const getYouTubeConfig = (): YouTubeConfig | null => {
    if (!YOUTUBE_API_KEY) return null;

    return {
        apiKey: YOUTUBE_API_KEY,
        cacheTtl: YOUTUBE_CACHE_TTL,
        cacheGracePeriod: YOUTUBE_CACHE_GRACE_PERIOD,
        cacheEmptyResults: YOUTUBE_CACHE_EMPTY_RESULTS,
        cacheChannelResults: YOUTUBE_CACHE_CHANNEL_RESULTS,
        maxResultsPerChannel: YOUTUBE_MAX_RESULTS_PER_CHANNEL,
        approvedChannels: APPROVED_YOUTUBE_CHANNELS,
    };
};

export const youTubeConfig = getYouTubeConfig();

export const assertYouTubeConfigured = () => {
    if (!youTubeConfig) {
        const err = new Error('YouTube integration not configured');
        (err as any).code = 'YOUTUBE_NOT_CONFIGURED';
        throw err;
    }
};
