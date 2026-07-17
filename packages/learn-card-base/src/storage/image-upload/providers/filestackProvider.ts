import localForage from 'localforage';

import { client, type UploadOptions } from '../../../filestack/ReactFileStackClient';
import {
    DefaultMetadata,
    getUrlsFromSrcSet,
    type ImageMetadata,
} from '../../../filestack/images/imageMetadata';
import type {
    TenantFilestackStorageConfig,
    TenantStorageConfig,
} from '../../../config/tenantConfig';
import { getLogger } from '../../../logging/logger';
import type {
    ImageTransformOptions,
    ImageUploadOptions,
    ImageUploadProvider,
    UploadRes,
} from '../types';

const log = getLogger('filestack-provider');

const normalizeDomain = (domain: string): string => {
    const normalized = domain.replace(/\/+$/, '');

    return /^https?:\/\//.test(normalized) ? normalized : `https://${normalized}`;
};

type FilestackUploadResponse = Partial<UploadRes> & Record<string, unknown>;

const normalizeUploadRes = (res: FilestackUploadResponse): UploadRes => ({
    filename: String(res.filename ?? ''),
    handle: String(res.handle ?? ''),
    mimetype: String(res.mimetype ?? ''),
    size: Number(res.size ?? 0),
    status: String(res.status ?? ''),
    url: String(res.url ?? ''),
});

const isFilestackConfig = (config: TenantStorageConfig): config is TenantFilestackStorageConfig =>
    config.provider === 'filestack';

export const createFilestackProvider = (storage: TenantStorageConfig): ImageUploadProvider => {
    if (!isFilestackConfig(storage))
        throw new Error('Filestack provider requires filestack storage config.');

    const filestack = client.init(storage.apiKey, { sessionCache: false });
    const cdnBase = normalizeDomain(storage.cdnDomain);
    const apiBase = normalizeDomain(storage.apiDomain);
    const cdnHost = new URL(cdnBase).host;

    const ownsUrl = (url?: string): boolean => {
        if (!url) return false;

        try {
            return new URL(url).host === cdnHost;
        } catch {
            return url.startsWith(`${cdnBase}/`);
        }
    };

    const getUrlParams = (url: string): string[] => {
        try {
            const parsed = new URL(url);

            return parsed.pathname.replace(/^\//, '').split('/').filter(Boolean);
        } catch {
            return url.replace(`${cdnBase}/`, '').split('/').filter(Boolean);
        }
    };

    const getCdnUrl = (handle: string): string => `${cdnBase}/${handle.replace(/^\/+/, '')}`;

    const getHandle = (url: string): string => {
        const urlParams = getUrlParams(url);

        return urlParams[urlParams.length - 1] ?? '';
    };

    const getUrlFromParams = (urlParams: string[]): string => getCdnUrl(urlParams.join('/'));

    const fixSrcSetString = (srcSetString: string, mimetype?: string, webp = false): string => {
        const urls = getUrlsFromSrcSet(srcSetString);

        return urls.map(url => `${fixUrl(url[0], mimetype, webp)} ${url[1]}`).join(', ');
    };

    const fixUrl = (url: string, mimetype?: string, webp = false): string => {
        if (url.split(' ').length > 1) return fixSrcSetString(url, mimetype, webp);

        const urlParams = getUrlParams(url).filter(param => param !== 'rotate=deg:exif');

        urlParams.splice(0, 0, 'rotate=deg:exif');

        if (mimetype !== 'image/gif') urlParams.splice(-1, 0, 'auto_image');
        if (webp) urlParams.splice(-1, 0, 'output=format:webp');

        return getUrlFromParams(urlParams);
    };

    const resizeUrl = (url: string, size: number): string => {
        const urlParams = getUrlParams(url).filter(param => !param.match(/resize.*/));

        if (urlParams.includes('rotate=deg:exif')) urlParams.splice(1, 0, `resize=width:${size}`);
        else urlParams.splice(0, 0, `resize=width:${size}`);

        return getUrlFromParams(urlParams);
    };

    const changeQuality = (url: string, quality: number): string => {
        const urlParams = getUrlParams(url).filter(param => !param.match(/quality.*/));

        if (urlParams.includes('rotate=deg:exif'))
            urlParams.splice(1, 0, `quality=value:${quality}`);
        else urlParams.splice(0, 0, `quality=value:${quality}`);

        return getUrlFromParams(urlParams);
    };

    const resizeAndChangeQuality = (
        url: string,
        size: number,
        quality: number,
        { mimetype, fix = false, webp = false }: ImageTransformOptions = {}
    ): string => {
        const updatedUrl = changeQuality(resizeUrl(url, size), quality);

        return fix ? fixUrl(updatedUrl, mimetype, webp) : updatedUrl;
    };

    const generateSrcSet = (
        url: string,
        resolutions: number[],
        { mimetype, fix = false, webp = false }: ImageTransformOptions = {}
    ): string => {
        const srcSet = resolutions
            .map(resolution => `${resizeUrl(url, resolution)} ${resolution}w`)
            .join(', ');

        return fix ? fixSrcSetString(srcSet, mimetype, webp) : srcSet;
    };

    const insertParams = (url: string | undefined, insertion: string): string | undefined => {
        if (!url || !ownsUrl(url)) return url;

        return url.replace(`${cdnBase}/`, `${cdnBase}/${insertion}`);
    };

    const getMetadata = async (url: string): Promise<ImageMetadata> => {
        const handle = getHandle(url);
        const localForageKey = 'ImageMetadata';
        const memoizedResult: Record<string, ImageMetadata> =
            (await localForage.getItem(localForageKey)) ?? {};

        if (memoizedResult[handle]) return memoizedResult[handle];

        try {
            const data = await Promise.all([
                fetch(`${apiBase}/api/file/${handle}/metadata`).then(res => res.json()),
                fetch(`${cdnBase}/imagesize/${handle}`).then(res => res.json()),
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

    const getFileType = (url: string): Promise<string> => {
        const handle = getHandle(url);

        return fetch(`${apiBase}/api/file/${handle}/metadata`)
            .then(res => res.json().then(data => String(data.mimetype ?? '')))
            .catch(error => {
                log.debug('filestack::getFileType::error', error);

                return '';
            });
    };

    const upload = (file: File, options?: ImageUploadOptions): Promise<UploadRes> =>
        filestack
            .upload(file, options as UploadOptions)
            .then(res => normalizeUploadRes(res as FilestackUploadResponse));

    const multiupload = (
        files: FileList | File[],
        options?: ImageUploadOptions
    ): Promise<UploadRes> =>
        filestack
            .multiupload(Array.from(files), options as UploadOptions)
            .then(res => normalizeUploadRes(res as FilestackUploadResponse));

    const uploadFromUrl = async (
        url: string,
        options?: ImageUploadOptions
    ): Promise<UploadRes | null> => {
        if (!url) return null;

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const filename = url.split('/').pop() || 'uploaded-file';
            const file = new File([blob], filename, { type: blob.type });

            return await upload(file, options);
        } catch (error) {
            log.debug('filestack::uploadFromUrl::error', error);

            return null;
        }
    };

    const getPreviewUrl = (url: string, options?: { width?: number; height?: number }): string => {
        if (!url) return url;

        const handle = getHandle(url);

        if (!handle) return url;
        if (!options) return `${cdnBase}/preview/${handle}`;

        const resize = options?.width
            ? `resize=width:${options.width}${options.height ? `,height:${options.height}` : ''}/`
            : '';

        return `${cdnBase}/output=format:jpg/${resize}${handle}`;
    };

    return {
        name: 'filestack',
        ownsUrl,
        upload,
        multiupload,
        uploadFromUrl,
        getCdnUrl,
        getHandle,
        getMetadata,
        getFileType,
        fixUrl,
        resizeUrl,
        changeQuality,
        resizeAndChangeQuality,
        generateSrcSet,
        insertParams,
        getPreviewUrl,
    };
};
