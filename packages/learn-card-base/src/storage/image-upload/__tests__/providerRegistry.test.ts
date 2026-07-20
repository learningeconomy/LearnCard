import { describe, expect, it, vi } from 'vitest';

import {
    getRegisteredImageUploadProviders,
    registerImageUploadProviderFactory,
    resolveImageUploadProvider,
} from '../providerRegistry';
import type { TenantStorageConfig } from '../../../config/tenantConfig';
import type { ImageUploadProvider } from '../types';

const createMockProvider = (name = 'test-provider'): ImageUploadProvider => ({
    name,
    ownsUrl: vi.fn().mockReturnValue(false),
    upload: vi.fn(),
    multiupload: vi.fn(),
    uploadFromUrl: vi.fn(),
    getCdnUrl: vi.fn(handle => `https://cdn.example.com/${handle}`),
    getHandle: vi.fn().mockReturnValue('handle'),
    getMetadata: vi.fn(),
    getFileType: vi.fn(),
    fixUrl: vi.fn(url => url),
    resizeUrl: vi.fn(url => url),
    changeQuality: vi.fn(url => url),
    resizeAndChangeQuality: vi.fn(url => url),
    generateSrcSet: vi.fn(url => url),
    insertParams: vi.fn(url => url),
    getPreviewUrl: vi.fn(url => url),
});

const storageConfig = (provider: string): TenantStorageConfig =>
    ({ provider } as TenantStorageConfig);

describe('image upload providerRegistry', () => {
    it('registers and resolves provider factories', () => {
        const provider = createMockProvider('test-image-provider');
        const factory = vi.fn().mockReturnValue(provider);

        registerImageUploadProviderFactory('test-image-provider', factory);

        const result = resolveImageUploadProvider(storageConfig('test-image-provider'));

        expect(result).toBe(provider);
        expect(factory).toHaveBeenCalledWith(storageConfig('test-image-provider'));
    });

    it('overwrites existing factories for a provider name', () => {
        const factory1 = vi.fn().mockReturnValue(createMockProvider('old-provider'));
        const factory2 = vi.fn().mockReturnValue(createMockProvider('new-provider'));

        registerImageUploadProviderFactory('test-overwrite-provider', factory1);
        registerImageUploadProviderFactory('test-overwrite-provider', factory2);

        const result = resolveImageUploadProvider(storageConfig('test-overwrite-provider'));

        expect(result.name).toBe('new-provider');
        expect(factory1).not.toHaveBeenCalled();
        expect(factory2).toHaveBeenCalledOnce();
    });

    it('lists registered provider names', () => {
        registerImageUploadProviderFactory('test-listed-provider', vi.fn());

        expect(getRegisteredImageUploadProviders()).toContain('test-listed-provider');
    });

    it('throws a useful error for unknown providers', () => {
        expect(() => resolveImageUploadProvider(storageConfig('missing-image-provider'))).toThrow(
            /No image upload provider registered for "missing-image-provider"\. Registered: .*Set tenant storage\.provider or register an image upload provider factory\./
        );
    });
});
