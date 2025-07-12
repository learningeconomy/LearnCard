type VideoPlatform = 'youtube' | 'vimeo' | 'unknown';

export type VideoMetadata = {
    type: VideoPlatform;
    videoId: string | null;
    embedUrl: string | null;
    thumbnailUrl: string | null;
};

export const getVideoMetadata = async (url: string): Promise<VideoMetadata> => {
    try {
        const parsedUrl = new URL(url);
        const hostname = parsedUrl.hostname.replace(/^www\./, '');

        // YouTube
        if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
            const match = url.match(
                /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
            );
            const videoId = match?.[1] ?? null;

            return {
                type: 'youtube',
                videoId,
                embedUrl: videoId ? `https://www.youtube.com/embed/${videoId}` : null,
                thumbnailUrl: videoId
                    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
                    : null,
            };
        }

        // Vimeo
        if (hostname.includes('vimeo.com')) {
            const match = url.match(/vimeo\.com\/(\d+)/);
            const videoId = match?.[1] ?? null;

            const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
            const res = await fetch(oembedUrl);
            const data = await res.json();

            return {
                type: 'vimeo',
                videoId,
                embedUrl: videoId ? `https://player.vimeo.com/video/${videoId}` : null,
                thumbnailUrl: data?.thumbnail_url ?? null,
            };
        }

        return {
            type: 'unknown',
            videoId: null,
            embedUrl: null,
            thumbnailUrl: null,
        };
    } catch (err) {
        console.error('Failed to extract video metadata:', err);
        return {
            type: 'unknown',
            videoId: null,
            embedUrl: null,
            thumbnailUrl: null,
        };
    }
};
