export type VideoPlatform = 'youtube' | 'vimeo' | 'drive' | 'loom' | 'unknown';

export type VideoMetadata = {
    type: VideoPlatform;
    videoId: string | null;
    embedUrl: string | null;
    thumbnailUrl: string | null;
};

/**
 * Whether a third-party video `<iframe>` embed can be expected to work in the
 * current document.
 *
 * YouTube's embed endpoint validates the `Referer` header and returns an
 * unplayable player ("Error 153: Video player configuration error") when it is
 * missing or not `http(s)`. Capacitor's iOS WebView serves the app from
 * `capacitor://localhost`, and WKWebView will not send a custom-scheme URL as a
 * referrer, so every YouTube embed fails inside the native iOS app.
 *
 * Android is unaffected (Capacitor serves it from `https://localhost`), as is
 * the web app. Rather than sniffing for Capacitor — which would drag a native
 * dependency into this package — we test the actual condition YouTube cares
 * about: is this document served over `http(s)`?
 *
 * Pass `platform` where it is known. Only YouTube rejects embeds this way —
 * Vimeo, Google Drive and Loom serve their players regardless of referrer — so
 * without the hint we stay conservative and treat any video as at risk.
 */
export const canEmbedVideoIframe = (platform?: VideoPlatform): boolean => {
    if (platform && platform !== 'youtube') return true;

    if (typeof window === 'undefined') return true;

    const protocol = window.location?.protocol;

    return protocol === 'https:' || protocol === 'http:';
};

/** Public `watch` URL for a video, used when we have to hand playback off to an external browser. */
export const getExternalVideoUrl = (
    metadata: VideoMetadata | null | undefined,
    fallbackUrl: string
): string => {
    if (metadata?.type === 'youtube' && metadata.videoId) {
        return `https://www.youtube.com/watch?v=${metadata.videoId}`;
    }

    return fallbackUrl;
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
