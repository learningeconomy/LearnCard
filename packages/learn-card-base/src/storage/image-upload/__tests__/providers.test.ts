import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFilestackProvider } from '../providers/filestackProvider';
import { createS3Provider } from '../providers/s3Provider';
import type {
    TenantFilestackStorageConfig,
    TenantS3StorageConfig,
} from '../../../config/tenantConfig';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../../../config/tenantDefaults';
import { isKnownImageUploadUrl, setImageUploadConfigFromTenant } from '../config';
import { getProvider } from '../../../filestack/images/images.helpers';
import { getFileMetadata } from '../../../helpers/attachment.helpers';

vi.mock('../../../filestack/ReactFileStackClient', () => ({
    client: {
        init: vi.fn(() => ({
            upload: vi.fn(),
            multiupload: vi.fn(),
        })),
    },
}));

const filestackConfig: TenantFilestackStorageConfig = {
    provider: 'filestack',
    apiKey: 'test-key',
    cdnDomain: 'cdn.example.com',
    apiDomain: 'www.example-api.com',
};

const s3Config: TenantS3StorageConfig = {
    provider: 's3',
    uploadEndpoint: 'https://uploads.example.com/images',
    cdnDomain: 'cdn.mytenant.app',
    bucket: 'mytenant-images',
};

describe('image upload providers', () => {
    afterEach(() => {
        setImageUploadConfigFromTenant(DEFAULT_LEARNCARD_TENANT_CONFIG);
        vi.restoreAllMocks();
    });

    it('uses configured Filestack CDN domain for CDN and resize URLs', () => {
        const provider = createFilestackProvider(filestackConfig);

        expect(provider.getCdnUrl('abc')).toBe('https://cdn.example.com/abc');
        expect(provider.resizeUrl('https://cdn.example.com/abc', 200)).toBe(
            'https://cdn.example.com/resize=width:200/abc'
        );
    });

    it('keeps Filestack fix transform order with configured CDN domain', () => {
        const provider = createFilestackProvider(filestackConfig);

        expect(provider.fixUrl('https://cdn.example.com/abc', 'image/png', true)).toContain(
            'https://cdn.example.com/rotate=deg:exif/auto_image/output=format:webp/abc'
        );
    });

    it('uses Filestack document previews without changing thumbnail previews', () => {
        const provider = createFilestackProvider(filestackConfig);
        const url = 'https://cdn.example.com/abc';

        expect(provider.getPreviewUrl(url)).toBe('https://cdn.example.com/preview/abc');
        expect(provider.getPreviewUrl(url, { width: 300, height: 200 })).toBe(
            'https://cdn.example.com/output=format:jpg/resize=width:300,height:200/abc'
        );
    });

    it('uploads to S3 endpoint and normalizes key responses', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ key: 'avatars/a.png' }),
        });
        const onProgress = vi.fn();

        vi.stubGlobal('fetch', fetchMock);

        const provider = createS3Provider(s3Config);
        const file = new File(['x'], 'x.png', { type: 'image/png' });
        const result = await provider.upload(file, { onProgress });

        expect(fetchMock).toHaveBeenCalledWith(
            'https://uploads.example.com/images',
            expect.objectContaining({ method: 'POST' })
        );
        expect(result.url).toBe('https://cdn.mytenant.app/avatars/a.png');
        expect(result.handle).toBe('avatars/a.png');
        expect(onProgress).toHaveBeenCalledWith({ totalPercent: 100 });
    });

    it('leaves S3 transform helpers as passthroughs', () => {
        const provider = createS3Provider(s3Config);
        const url = 'https://cdn.mytenant.app/avatars/a.png';

        expect(provider.fixUrl(url)).toBe(url);
        expect(provider.resizeUrl(url, 200)).toBe(url);
        expect(provider.changeQuality(url, 80)).toBe(url);
        expect(provider.resizeAndChangeQuality(url, 200, 80)).toBe(url);
        expect(provider.generateSrcSet(url, [200, 400])).toBe(url);
        expect(provider.insertParams(url, 'resize=width:200/')).toBe(url);
        expect(provider.getPreviewUrl(url)).toBe(url);
    });

    it('recognizes active provider URLs and legacy Filestack CDN URLs', () => {
        setImageUploadConfigFromTenant({
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            storage: s3Config,
        });

        expect(isKnownImageUploadUrl('https://cdn.mytenant.app/avatars/a.png')).toBe(true);
        expect(isKnownImageUploadUrl('https://cdn.filestackcontent.com/legacy')).toBe(true);
        expect(isKnownImageUploadUrl('https://example.com/cdn.filestackcontent.com/legacy')).toBe(
            false
        );
    });

    it('derives S3 attachment metadata from the object key', async () => {
        setImageUploadConfigFromTenant({
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            storage: s3Config,
        });

        const url = 'https://cdn.mytenant.app/documents/my.resume.pdf';

        expect(getProvider(url)).toBeNull();
        await expect(getFileMetadata(url)).resolves.toMatchObject({
            fileExtension: 'pdf',
        });
    });
});
