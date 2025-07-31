export type VideoPlatform = 'youtube' | 'vimeo' | 'drive' | 'loom' | 'unknown';

export type VideoMetadata = {
    type: VideoPlatform;
    videoId: string | null;
    embedUrl: string | null;
    thumbnailUrl: string | null;
};

export const getVideoMetadata = async (url: string): Promise<VideoMetadata> => {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, '');
        let id: string | null = null;

        // YouTube
        if (host === 'youtu.be' || host.includes('youtube.com')) {
            if (host === 'youtu.be') {
                id = parsed.pathname.slice(1);
            } else {
                id =
                    parsed.searchParams.get('v') ||
                    parsed.pathname.split('/').filter(Boolean).pop() ||
                    null;
            }
            if (id) {
                let thumb = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
                try {
                    const res = await fetch(thumb, { method: 'HEAD' });
                    if (!res.ok) thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                } catch {
                    thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
                }
                return {
                    type: 'youtube',
                    videoId: id,
                    embedUrl: `https://www.youtube.com/embed/${id}`,
                    thumbnailUrl: thumb,
                };
            }
        }

        // Vimeo
        if (host.includes('vimeo.com')) {
            const match = url.match(/vimeo\.com\/(\d+)/);
            id = match?.[1] ?? null;
            if (id) {
                try {
                    const oembed = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
                        url
                    )}`;
                    const data = await fetch(oembed).then(r => r.json());
                    return {
                        type: 'vimeo',
                        videoId: id,
                        embedUrl: `https://player.vimeo.com/video/${id}`,
                        thumbnailUrl: data.thumbnail_url,
                    };
                } catch (e) {
                    // Fallback if oEmbed fails
                    return {
                        type: 'vimeo',
                        videoId: id,
                        embedUrl: `https://player.vimeo.com/video/${id}`,
                        thumbnailUrl: null,
                    };
                }
            }
        }

        // Google Drive
        if (host === 'drive.google.com' || host === 'docs.google.com') {
            const match = parsed.pathname.match(/\/d\/([^/]+)/);
            id = match?.[1] ?? parsed.searchParams.get('id');
            if (id) {
                return {
                    type: 'drive',
                    videoId: id,
                    embedUrl: `https://drive.google.com/file/d/${id}/preview`,
                    thumbnailUrl: `https://drive.google.com/thumbnail?sz=w320-h320&id=${id}`,
                };
            }
        }

        // Loom
        if (host === 'loom.com') {
            const match = parsed.pathname.match(/\/(?:share|embed|watch)\/([A-Za-z0-9]+)/);
            id = match?.[1] ?? null;
            if (id) {
                const embedUrl = `https://www.loom.com/embed/${id}`;
                try {
                    const oembedUrl = `https://www.loom.com/api/oembed?url=${encodeURIComponent(
                        url
                    )}`;
                    const response = await fetch(oembedUrl);
                    if (!response.ok) {
                        throw new Error(`oEmbed API returned ${response.status}`);
                    }
                    const data = await response.json();
                    return {
                        type: 'loom',
                        videoId: id,
                        embedUrl,
                        thumbnailUrl: data.thumbnail_url,
                    };
                } catch (e) {
                    // Fallback if oEmbed fails
                    console.warn('Loom oEmbed fetch failed:', e);
                    return {
                        type: 'loom',
                        videoId: id,
                        embedUrl,
                        thumbnailUrl: null,
                    };
                }
            }
        }

        // Fallback
        return { type: 'unknown', videoId: null, embedUrl: null, thumbnailUrl: null };
    } catch (e) {
        console.error('getVideoMetadata error:', e);
        return { type: 'unknown', videoId: null, embedUrl: null, thumbnailUrl: null };
    }
};
