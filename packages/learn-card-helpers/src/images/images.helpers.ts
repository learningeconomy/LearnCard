import * as filestack from './filestack.helpers';
import * as unsplash from './unsplash.helpers';
import * as discord from './discord.helpers';

const Providers = { filestack, unsplash, discord };

export const getProvider = (url?: string): keyof typeof Providers | null => {
    if (url?.includes('cdn.filestackcontent.com')) return 'filestack';

    if (url?.includes('images.unsplash.com')) return 'unsplash';

    if (url?.includes('cdn.discordapp.com')) return 'discord';

    return null;
};

export const changeQuality = (url: string, quality: number): string => {
    const provider = getProvider(url);

    if (!provider) return url;

    return Providers[provider].changeQuality(url, quality);
};

export const fixUrl = (url: string, mimetype?: string, webp = false): string => {
    const provider = getProvider(url);

    if (!provider) return url;

    return Providers[provider].fixUrl(url, mimetype, webp);
};

export const generateSrcSet = (
    url: string,
    resolutions: number[],
    options: { mimetype?: string; fix?: boolean; webp?: boolean } = {}
): string => {
    const provider = getProvider(url);

    if (!provider) return url;

    return Providers[provider].generateSrcSet(url, resolutions, options);
};

export const resizeAndChangeQuality = (
    url: string,
    size: number,
    quality: number,
    options: { mimetype?: string; fix?: boolean; webp?: boolean } = {}
): string => {
    const provider = getProvider(url);

    if (!provider) return url;

    return Providers[provider].resizeAndChangeQuality(url, size, quality, options);
};

export const DEFAULT_RESOLUTIONS = [200, 400, 600];

/**
 * Gets an array of URLs from a srcSet string
 *
 * @param srcSet HTML srcSet string (e.g. 'test.com/img 100w, test.com/img2 200w')
 *
 * @return URLs
 */
export const getUrlsFromSrcSet = (srcSet: string): [string, string][] => {
    return srcSet.split(/,? /).reduce<[string, string][]>((accumulator, current, index, array) => {
        if (index % 2 === 0) return accumulator;

        accumulator.push([array[index - 1], current]);

        return accumulator;
    }, []);
};
