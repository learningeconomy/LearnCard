import * as filestack from './filestack.helpers';
import * as unsplash from './unsplash.helpers';
import { createResource, Resource } from './Resource';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../../config/tenantDefaults';
import { getImageUploadProvider } from '../../storage/image-upload';

const Providers = { filestack, unsplash };
const getUrlHost = (url?: string): string | undefined => {
    if (!url) return;

    try {
        return new URL(url).host;
    } catch {
        return;
    }
};

const isFilestackCdnUrl = (url?: string): boolean =>
    getUrlHost(url) === DEFAULT_LEARNCARD_TENANT_CONFIG.storage.cdnDomain;

const isUnsplashUrl = (url: string): boolean => getUrlHost(url) === 'images.unsplash.com';

const getImageProviderForUrl = (url?: string) => {
    const activeProvider = getImageUploadProvider();

    if (activeProvider.ownsUrl(url)) return activeProvider;

    if (isFilestackCdnUrl(url)) {
        return getImageUploadProvider(DEFAULT_LEARNCARD_TENANT_CONFIG.storage);
    }

    return null;
};

export const getProvider = (url?: string): keyof typeof Providers | null => {
    if (getImageProviderForUrl(url)) return 'filestack';

    if (url && isUnsplashUrl(url)) return 'unsplash';

    return null;
};

export const changeQuality = (url: string, quality: number): string => {
    const imageProvider = getImageProviderForUrl(url);

    if (imageProvider) return imageProvider.changeQuality(url, quality);

    if (isUnsplashUrl(url)) return unsplash.changeQuality(url, quality);

    return url;
};

export const fixUrl = (url: string, mimetype?: string, webp = false): string => {
    const imageProvider = getImageProviderForUrl(url);

    if (imageProvider) return imageProvider.fixUrl(url, mimetype, webp);

    if (isUnsplashUrl(url)) return unsplash.fixUrl(url, mimetype, webp);

    return url;
};

export const generateSrcSet = (
    url: string,
    resolutions: number[],
    options: { mimetype?: string; fix?: boolean; webp?: boolean } = {}
): string => {
    const imageProvider = getImageProviderForUrl(url);

    if (imageProvider) return imageProvider.generateSrcSet(url, resolutions, options);

    if (isUnsplashUrl(url)) return unsplash.generateSrcSet(url, resolutions, options);

    return url;
};

export const resizeAndChangeQuality = (
    url: string,
    size: number,
    quality: number,
    options: { mimetype?: string; fix?: boolean; webp?: boolean } = {}
): string => {
    const imageProvider = getImageProviderForUrl(url);

    if (imageProvider) return imageProvider.resizeAndChangeQuality(url, size, quality, options);

    if (isUnsplashUrl(url)) {
        return unsplash.resizeAndChangeQuality(url, size, quality, options);
    }

    return url;
};

export type ImageMetadata = {
    filename: string;
    mimetype: string;
    size: number;
    uploaded: number;
    writeable: boolean;
    height: number;
    width: number;
};

export const DefaultMetadata: ImageMetadata = {
    filename: '',
    mimetype: '',
    size: 1,
    uploaded: 1,
    writeable: false,
    height: 1,
    width: 1,
};

export const getMetadata = async (url: string): Promise<ImageMetadata> => {
    const imageProvider = getImageProviderForUrl(url);

    if (imageProvider) return imageProvider.getMetadata(url);

    if (isUnsplashUrl(url)) return unsplash.getMetadata(url);

    return DefaultMetadata;
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

// Simple cache object to keep track of images already seen/loaded
const cache = new Map<string, any>();

const getImage = async (source: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        // Create a new image element
        const img = new Image();

        // add load event handler to resolve the promise
        // set before source
        // see https://stackoverflow.com/questions/14648598/is-it-necessary-to-set-onload-function-before-setting-src-for-an-image-object
        img.onload = () => resolve(source);
        // set the src to our source which will immediantly start fetching
        img.src = source;

        if (img.naturalWidth) {
            // If the browser can determine the naturalWidth the image is already loaded successfully
            resolve(source);
        } else if (img.complete) {
            // If the image is complete but the naturalWidth is 0px it is probably broken
            reject(source);
        }

        // and also the error event to reject the promise
        img.onerror = () => {
            reject(new Error(`Failed to load image ${source}`));
        };
    });
};

// Create our loadImage function, this function receives the source
// of the image and returns a resource
export const loadImage = (source: string, parameters?: any): Resource<string> => {
    let resource = cache.get(source);
    if (resource) return resource;

    resource = createResource(() => getImage(source), parameters);

    if (cache.size > 200) {
        const randomKey = cache.get(
            [...Object.keys(cache)][Math.floor(Math.random() * cache.size)]
        );
        cache.delete(randomKey);
    }
    cache.set(source, resource);

    return resource;
};

/**
 * Converts a standard Filestack file URL into a preview-friendly JPG thumbnail.
 *
 * @param url - The original Filestack CDN URL.
 * @param options - Optional width and height to resize the thumbnail.
 * @returns A Filestack preview URL you can use in <img src /> or background-image.
 */
export function getFilestackPreviewUrl(
    url: string,
    options?: { width?: number; height?: number }
): string {
    const imageProvider = getImageProviderForUrl(url);

    if (!imageProvider) return url;

    return imageProvider.getPreviewUrl(url, options);
}
