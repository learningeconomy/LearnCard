import type { ImageMetadata } from '../../filestack/images/images.helpers';

export type UploadRes = {
    filename: string;
    handle: string;
    mimetype: string;
    size: number;
    status: string;
    url: string;
};

export type ImageUploadProgressEvent = { totalPercent: number };

export type ImageUploadOptions = {
    onProgress?: (event: ImageUploadProgressEvent) => void;
} & Record<string, unknown>;

export type ImageTransformOptions = {
    mimetype?: string;
    fix?: boolean;
    webp?: boolean;
};

export interface ImageUploadProvider {
    readonly name: string;
    ownsUrl: (url?: string) => boolean;
    upload: (file: File, options?: ImageUploadOptions) => Promise<UploadRes>;
    multiupload: (files: FileList | File[], options?: ImageUploadOptions) => Promise<UploadRes>;
    uploadFromUrl: (url: string, options?: ImageUploadOptions) => Promise<UploadRes | null>;
    getCdnUrl: (handle: string) => string;
    getHandle: (url: string) => string;
    getMetadata: (url: string) => Promise<ImageMetadata>;
    getFileType: (url: string) => Promise<string>;
    fixUrl: (url: string, mimetype?: string, webp?: boolean) => string;
    resizeUrl: (url: string, size: number) => string;
    changeQuality: (url: string, quality: number) => string;
    resizeAndChangeQuality: (
        url: string,
        size: number,
        quality: number,
        options?: ImageTransformOptions
    ) => string;
    generateSrcSet: (url: string, resolutions: number[], options?: ImageTransformOptions) => string;
    insertParams: (url: string | undefined, insertion: string) => string | undefined;
    getPreviewUrl: (url: string, options?: { width?: number; height?: number }) => string;
}
