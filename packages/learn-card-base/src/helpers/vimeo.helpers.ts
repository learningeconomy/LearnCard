export const isVimeoUrl = (url: string) => {
    try {
        const { hostname } = new URL(url);
        return hostname.includes('vimeo.com');
    } catch {
        return false;
    }
};

export const getVimeoVideoId = (url: string) => {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : '';
};

export const getVimeoEmbedUrl = (url: string) => {
    const id = getVimeoVideoId(url);
    return id ? `https://player.vimeo.com/video/${id}` : '';
};

export const getVimeoThumbnailUrl = async (url: string): Promise<string | null> => {
    try {
        const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        return data?.thumbnail_url || null;
    } catch {
        return null;
    }
};
