import localForage from 'localforage';

import { DefaultMetadata, getUrlsFromSrcSet, type ImageMetadata } from './imageMetadata';
import { getLogger } from '../../logging/logger';

const log = getLogger('filestack-helpers');

/**
 * Creates an array of Filestack URL Parameters
 *
 * @param url Filestack URL
 *
 * @return Filestack URL Parameters
 */
export const getUrlParams = (url: string): string[] => url.split('.com/')[1]?.split('/') ?? [];

/**
 * Converts an array of Filestack URL Parameters to a valid Filestack URL
 *
 * @param urlParams Filestack URL Parameters
 *
 * @return Filestack URL
 */
export const getUrlFromUrlParams = (urlParams: string[]): string =>
    `https://cdn.filestackcontent.com/${urlParams.join('/')}`;

/**
 * Gets the handle from a Filestack URL
 *
 * @param url Filestack URL
 *
 * @return Filestack handle
 */
export const getFilestackHandle = (url: string): string => {
    const urlParams = getUrlParams(url);

    return urlParams[urlParams.length - 1] ?? '';
};

/**
 * Gets the metadata from a Filestack URL
 *
 * This function uses localForage to memoize its results.
 *
 * Results are stored under the key 'ImageMetadata', with a maximum of 200 metadata objects stored
 * in the localForage cache.
 *
 * TODO: Find a better way to cache this data (preferably using Apollo)
 *
 * @param url Filestack URL
 */
export const getMetadata = async (url: string): Promise<ImageMetadata> => {
    const handle = getFilestackHandle(url);
    const localForageKey = 'ImageMetadata';
    const memoizedResult: Record<string, ImageMetadata> =
        (await localForage.getItem(localForageKey)) ?? {};

    if (memoizedResult[handle]) return memoizedResult[handle];

    try {
        const data = await Promise.all([
            fetch(`https://www.filestackapi.com/api/file/${handle}/metadata`).then(res =>
                res.json()
            ),
            fetch(`https://cdn.filestackcontent.com/imagesize/${handle}`).then(res => res.json()),
        ]);

        const metadata: ImageMetadata = { ...data[0], ...data[1] };
        const memoizedResultKeys = Object.keys(memoizedResult);

        if (memoizedResultKeys.length >= 200) {
            delete memoizedResult[
                memoizedResultKeys[Math.floor(Math.random() * memoizedResultKeys.length)]
            ];
        }

        localForage.setItem(localForageKey, { ...memoizedResult, [handle]: metadata });

        return metadata;
    } catch (e) {
        log.debug('filestack::getMetadata::error', e);

        return DefaultMetadata;
    }
};

export const getFileType = (url: string): Promise<string> => {
    const handle = getFilestackHandle(url);

    return fetch(`https://www.filestackapi.com/api/file/${handle}/metadata`)
        .then(res => res.json().then(data => String(data.mimetype ?? '')))
        .catch(error => {
            log.debug('filestack::getFileType::error', error);

            return '';
        });
};

export const fileTypeSupportsPreview = (fileType: string): boolean => {
    const unsupportedFileTypes = [
        'application/vnd.apple.pages', // .pages
        'application/vnd.apple.numbers', // .numbers
        'application/x-iwork-keynote-sffkey', // .key
    ];

    return !unsupportedFileTypes.includes(fileType);
};

/**
 * Fixes image rotation based on EXIF data and uses auto_image on a given URL
 *
 * @param url URL to fix
 * @param mimetype MIME type (e.g. image/gif)
 * @param webp flag to indicate whether we should manually specify conversion to webp
 *
 * @return fixed URL
 */
export const fixUrl = (url: string, mimetype?: string, webp = false): string => {
    if (url.split(' ').length > 1) return fixSrcSetString(url, mimetype, webp);

    const urlParams = getUrlParams(url).filter(param => param !== 'rotate=deg:exif');

    urlParams.splice(0, 0, 'rotate=deg:exif');

    if (mimetype !== 'image/gif') urlParams.splice(-1, 0, 'auto_image');
    if (webp) urlParams.splice(-1, 0, 'output=format:webp');

    return getUrlFromUrlParams(urlParams);
};

/**
 * Fixes image rotation based on EXIF data and uses auto_image on a given srcset string
 *
 * @param srcSetString srcSet string to fix
 * @param mimetype MIME type (e.g. image/gif)
 * @param webp flag to indicate whether we should manually specify conversion to webp
 *
 * @return fixed srcset string
 */
export const fixSrcSetString = (srcSetString: string, mimetype?: string, webp = false): string => {
    const urls = getUrlsFromSrcSet(srcSetString);

    return urls.map(url => `${fixUrl(url[0], mimetype, webp)} ${url[1]}`).join(', ');
};

/**
 * Resizes a filestack image to the given size
 *
 * @param url Filestack URL to resize
 * @param size Target output width
 *
 * @return Filestack URL
 */
export const resizeUrl = (url: string, size: number): string => {
    const urlParams = getUrlParams(url).filter(param => !param.match(/resize.*/));

    if (urlParams.includes('rotate=deg:exif')) urlParams.splice(1, 0, `resize=width:${size}`);
    else urlParams.splice(0, 0, `resize=width:${size}`);

    return getUrlFromUrlParams(urlParams);
};

/**
 * Changes a filestack image's quality to the given value
 *
 * @param url Filestack URL to change
 * @param quality quality value (1-100)
 *
 * @return Filestack URL
 */
export const changeQuality = (url: string, quality: number): string => {
    const urlParams = getUrlParams(url).filter(param => !param.match(/quality.*/));

    if (urlParams.includes('rotate=deg:exif')) urlParams.splice(1, 0, `quality=value:${quality}`);
    else urlParams.splice(0, 0, `quality=value:${quality}`);

    return getUrlFromUrlParams(urlParams);
};

/**
 * Resizes and changes a filestack image's quality
 *
 * @param url Filestack URL to change
 * @param size Target output width
 * @param quality quality value (1-100)
 *
 * @return Filestack URL
 */
export const resizeAndChangeQuality = (
    url: string,
    size: number,
    quality: number,
    {
        mimetype,
        fix = false,
        webp = false,
    }: { mimetype?: string; fix?: boolean; webp?: boolean } = {}
) => {
    const updatedUrl = changeQuality(resizeUrl(url, size), quality);

    return fix ? fixUrl(updatedUrl, mimetype, webp) : updatedUrl;
};

/**
 * Generates a responsive srcset string from a Filestack URL and array of resolutions
 *
 * @param url Filestack URL
 * @param resolutions list of resolutions
 *
 * @return srcset string
 */
export const generateSrcSet = (
    url: string,
    resolutions: number[],
    {
        mimetype,
        fix = false,
        webp = false,
    }: { mimetype?: string; fix?: boolean; webp?: boolean } = {}
) => {
    const srcSet = resolutions
        .map(resolution => `${resizeUrl(url, resolution)} ${resolution}w`)
        .join(', ');

    return fix ? fixSrcSetString(srcSet, mimetype, webp) : srcSet;
};

/**
 * Used to insert various modifiers and url params into the default filestack url of the format https://cdn.filestackcontent.com/232342342
 * EG for example resize params https://blog.filestack.com/how-to-automatically-resize-fit-and-align-any-image-using-only-url-parameters/
 * For example I want to resize a default filestack url with these resize and quality aprams "resize=width:100/quality=value:75/
 * woudl result in something like https://cdn.filestackcontent.com/resize=width:100/quality=value:75/Dss4qWaQ3GKkbFXVU7lJ
 */
export const insertParamsToFilestackUrl = (filestackUrl: string | undefined, insertion: string) => {
    if (!filestackUrl) return filestackUrl;

    return filestackUrl.replace(
        'https://cdn.filestackcontent.com/',
        `https://cdn.filestackcontent.com/${insertion}`
    );
};

/** Whether a URL is served by the Filestack CDN. */
export const isFilestackUrl = (url: string | undefined): url is string =>
    Boolean(url?.startsWith('https://cdn.filestackcontent.com/'));

/**
 * Whether a URL can actually carry transformation tasks: it must be a Filestack
 * CDN URL *and* end in a file handle for those tasks to apply to.
 *
 * The handle check matters because the CDN root on its own
 * (`https://cdn.filestackcontent.com/`) passes `isFilestackUrl` but has nothing
 * to transform — tasks spliced onto it produce a task-only URL that 404s.
 */
export const isOptimizableFilestackUrl = (url: string | undefined): url is string => {
    if (!isFilestackUrl(url)) return false;

    const urlParams = getUrlParams(url);

    return Boolean(urlParams[urlParams.length - 1]);
};

/**
 * Resizes a Filestack image and converts it to a modern format at an explicit
 * quality, replacing any resize/quality/output tasks already on the URL.
 *
 * Prefer this over `resizeAndChangeQuality` when the source is a PNG. The
 * standalone `quality=value:N` task only applies to JPEG output — Filestack
 * silently ignores it for PNG and WebP, so `resize=width:1600/quality=value:75`
 * on a PNG still returns a full-weight PNG. Quality for a converted image has to
 * ride on the `output` task itself (`output=format:webp,quality:75`).
 *
 * URLs that cannot carry transformation tasks are returned untouched.
 *
 * @param url Filestack URL
 * @param width Target output width
 * @param quality Quality value (1-100)
 * @param format Output format
 *
 * @return Filestack URL
 */
export const optimizeUrl = (
    url: string,
    { width, quality = 75, format = 'webp' }: { width: number; quality?: number; format?: string }
): string => {
    if (!isOptimizableFilestackUrl(url)) return url;

    const urlParams = getUrlParams(url).filter(param => !param.match(/^(resize|quality|output)=/));

    // Tasks go before the trailing handle, and after any leading task (a
    // security policy, say) that we are not replacing.
    urlParams.splice(-1, 0, `resize=width:${width}`, `output=format:${format},quality:${quality}`);

    return getUrlFromUrlParams(urlParams);
};

/**
 * Generates a responsive srcset string of optimized Filestack renditions.
 *
 * Returns an empty string when the URL cannot be optimized. Mapping every width
 * onto the one untransformable URL would advertise renditions that do not
 * exist, so the honest answer is to offer no candidates and let the caller's
 * `src` stand on its own.
 *
 * @param url Filestack URL
 * @param widths list of widths
 *
 * @return srcset string, or '' if the URL cannot be optimized
 */
export const generateOptimizedSrcSet = (
    url: string,
    widths: number[],
    options: { quality?: number; format?: string } = {}
): string => {
    if (!isOptimizableFilestackUrl(url)) return '';

    return widths.map(width => `${optimizeUrl(url, { ...options, width })} ${width}w`).join(', ');
};
