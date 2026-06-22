import { DefaultMetadata } from '../../../filestack/images/images.helpers';
import type { TenantS3StorageConfig, TenantStorageConfig } from '../../../config/tenantConfig';
import { getLogger } from '../../../logging/logger';
import type { ImageUploadOptions, ImageUploadProvider, UploadRes } from '../types';

const log = getLogger('s3-image-provider');

const normalizeDomain = (domain: string): string => {
    const normalized = domain.replace(/\/+$/, '');

    return /^https?:\/\//.test(normalized) ? normalized : `https://${normalized}`;
};

type S3UploadResponse = {
    url?: string;
    key?: string;
    handle?: string;
    filename?: string;
    mimetype?: string;
    size?: number;
    status?: string;
};

const isS3Config = (config: TenantStorageConfig): config is TenantS3StorageConfig =>
    config.provider === 's3';

export const createS3Provider = (storage: TenantStorageConfig): ImageUploadProvider => {
    if (!isS3Config(storage)) throw new Error('S3 provider requires s3 storage config.');

    const cdnBase = normalizeDomain(storage.cdnDomain);
    const cdnHost = new URL(cdnBase).host;

    const getHandle = (url: string): string => {
        try {
            return new URL(url).pathname.replace(/^\//, '');
        } catch {
            return url.replace(`${cdnBase}/`, '').replace(/^\//, '');
        }
    };

    const getCdnUrl = (handle: string): string => `${cdnBase}/${handle.replace(/^\/+/, '')}`;

    const ownsUrl = (url?: string): boolean => {
        if (!url) return false;

        try {
            return new URL(url).host === cdnHost;
        } catch {
            return url.startsWith(`${cdnBase}/`);
        }
    };

    const upload = async (file: File, options?: ImageUploadOptions): Promise<UploadRes> => {
        const formData = new FormData();

        formData.append('file', file);
        if (storage.bucket) formData.append('bucket', storage.bucket);

        const response = await fetch(storage.uploadEndpoint, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error(`S3 upload failed (${response.status})`);

        const data = (await response.json()) as S3UploadResponse;
        const keyOrHandle = data.key ?? data.handle;
        const url = data.url ?? (keyOrHandle ? getCdnUrl(keyOrHandle) : undefined);

        if (!url) throw new Error('S3 upload response must include url, key, or handle.');

        options?.onProgress?.({ totalPercent: 100 });

        return {
            filename: data.filename ?? file.name,
            handle: data.handle ?? data.key ?? getHandle(url),
            mimetype: data.mimetype ?? file.type,
            size: data.size ?? file.size,
            status: data.status ?? 'Stored',
            url,
        };
    };

    const multiupload = async (
        files: FileList | File[],
        options?: ImageUploadOptions
    ): Promise<UploadRes> => {
        const fileList = Array.from(files);

        if (fileList.length === 0) throw new Error('S3 multiupload requires at least one file.');

        const [firstFile, ...remainingFiles] = fileList;
        const firstResult = await upload(firstFile, options);

        for (const file of remainingFiles) await upload(file, options);

        return firstResult;
    };

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
            log.debug('s3::uploadFromUrl::error', error);

            return null;
        }
    };

    return {
        name: 's3',
        ownsUrl,
        upload,
        multiupload,
        uploadFromUrl,
        getCdnUrl,
        getHandle,
        getMetadata: async () => DefaultMetadata,
        getFileType: async () => '',
        fixUrl: url => url,
        resizeUrl: url => url,
        changeQuality: url => url,
        resizeAndChangeQuality: url => url,
        generateSrcSet: url => url,
        insertParams: url => url,
        getPreviewUrl: url => url,
    };
};
