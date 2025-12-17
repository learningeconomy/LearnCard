import * as filestack from './filestack.helpers';
import * as unsplash from './unsplash.helpers';
import { createResource, Resource } from './Resource';

const Providers = { filestack, unsplash };

export const getProvider = (url?: string): keyof typeof Providers | null => {
    if (url?.includes('cdn.filestackcontent.com')) return 'filestack';

    if (url?.includes('images.unsplash.com')) return 'unsplash';

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
    const provider = getProvider(url);

    if (!provider) return DefaultMetadata;

    return Providers[provider].getMetadata(url);
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
    const match = url.match(/filestackcontent\.com\/(?:\w+=.*\/)?([a-zA-Z0-9]+)/);
    const handle = match?.[1];

    if (!handle) throw new Error('Invalid Filestack URL');

    const transformations = ['output=format:jpg'];

    if (options?.width || options?.height) {
        const width = options.width ?? 300;
        const height = options.height ?? 200;
        transformations.push(`resize=width:${width},height:${height}`);
    }

    return `https://cdn.filestackcontent.com/${transformations.join('/')}/${handle}`;
}
