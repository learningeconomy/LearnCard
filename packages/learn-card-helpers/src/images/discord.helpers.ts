import qs from 'query-string';

import { quantizeValue } from '../arrays';
import { getUrlsFromSrcSet } from './images.helpers';

/**
 * Fixes image rotation based on EXIF data and uses auto_image on a given srcset string
 *
 * @param srcSetString srcset string to fix
 * @param mimetype MIME type (e.g. image/gif)
 * @param webp flag to indicate whether we should manually specify conversion to webp
 *
 * @return fixed srcset string
 */
export const fixSrcSetString = (
    srcSetString: string,
    _mimetype?: string,
    _webp = false
): string => {
    const urls = getUrlsFromSrcSet(srcSetString);

    return urls.map(([url, width]) => `${fixUrl(url)} ${width}`).join(', ');
};

/**
 * Returns the best format on a given URL
 *
 * @param url URL to fix
 *
 * @return fixed URL
 */
export const fixUrl = (url: string, _mimetype?: string, _webp = false): string => {
    return url;
};

export const VALID_DISCORD_SIZES = [20, 32, 40, 60, 64, 80, 100, 128, 256, 512, 1024, 2048, 4096];

/**
 * Resizes an Discord image to the given size
 *
 * @param url Discord URL to resize
 * @param size Target output width
 *
 * @return Discord URL
 */
export const resizeUrl = (url: string, size: number): string => {
    const parsedUrl = qs.parseUrl(url);

    parsedUrl.query.size = quantizeValue(size, VALID_DISCORD_SIZES).toString();

    return qs.stringifyUrl(parsedUrl);
};

/**
 * Changes an Discord image's quality to the given value
 *
 * @param url Discord URL to change
 * @param quality quality value (1-100)
 *
 * @return Discord URL
 */
export const changeQuality = (url: string, _quality: number): string => {
    return url;
};

/**
 * Resizes and changes an Discord image's quality
 *
 * @param url Discord URL to change
 * @param size Target output width
 * @param quality quality value (1-100)
 *
 * @return Discord URL
 */
export const resizeAndChangeQuality = (
    url: string,
    size: number,
    quality: number,
    { fix = false }: { mimetype?: string; fix?: boolean; webp?: boolean } = {}
): string => {
    const updatedUrl = changeQuality(resizeUrl(url, size), quality);

    return fix ? fixUrl(updatedUrl) : updatedUrl;
};

/**
 * Generates a responsive srcset string from an Discord URL and array of resolutions
 *
 * @param url Discord URL
 * @param resolutions list of resolutions
 *
 * @return srcset string
 */
export const generateSrcSet = (
    url: string,
    resolutions: number[],
    { fix = false }: { mimetype?: string; fix?: boolean; webp?: boolean } = {}
): string => {
    const srcSet = resolutions
        .map(resolution => `${resizeUrl(url, resolution)} ${resolution}w`)
        .join(', ');

    return fix ? fixSrcSetString(srcSet) : srcSet;
};
