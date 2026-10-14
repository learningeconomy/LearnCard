// @vitest-environment jsdom

import React, { useEffect } from 'react';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_LEARNCARD_TENANT_CONFIG } from '../../../config/tenantDefaults';
import { registerImageUploadProviderFactory, setImageUploadConfigFromTenant } from '..';
import type { ImageUploadProvider, UploadRes } from '..';
import type { TenantConfig, TenantStorageConfig } from '../../../config/tenantConfig';
import { useImageUpload } from '../useImageUpload';

const uploadRes: UploadRes = {
    filename: 'x.png',
    handle: 'x-handle',
    mimetype: 'image/png',
    size: 1,
    status: 'Stored',
    url: 'https://cdn.test/x.png',
};

const createTestProvider = (upload: ImageUploadProvider['upload']): ImageUploadProvider => ({
    name: 'test-hook-provider',
    ownsUrl: vi.fn().mockReturnValue(false),
    upload,
    multiupload: vi.fn(),
    uploadFromUrl: vi.fn(),
    getCdnUrl: vi.fn(handle => `https://cdn.test/${handle}`),
    getHandle: vi.fn().mockReturnValue('x-handle'),
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

describe('useImageUpload', () => {
    afterEach(() => {
        setImageUploadConfigFromTenant(DEFAULT_LEARNCARD_TENANT_CONFIG);
        vi.restoreAllMocks();
    });

    it('uploads through the active image provider and preserves hook surface', async () => {
        const upload = vi.fn().mockResolvedValue(uploadRes);
        const onUpload = vi.fn();
        const surfaceSpy = vi.fn();
        const file = new File(['x'], 'x.png', { type: 'image/png' });

        registerImageUploadProviderFactory('test-hook-provider', () => createTestProvider(upload));
        setImageUploadConfigFromTenant({
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            storage: { provider: 'test-hook-provider' } as unknown as TenantStorageConfig,
        } as TenantConfig);

        const TestComponent = () => {
            const imageUpload = useImageUpload({ onUpload });

            useEffect(() => {
                surfaceSpy(imageUpload);
                imageUpload.directUploadFile(file);
            }, []);

            return null;
        };

        render(<TestComponent />);

        await waitFor(() => expect(upload).toHaveBeenCalledWith(file, {}));
        await waitFor(() => expect(onUpload).toHaveBeenCalledWith(uploadRes.url, file, uploadRes));

        expect(surfaceSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                singleImageUpload: expect.any(Function),
                uploadImageFromUrl: expect.any(Function),
            })
        );
    });

    it('never uploads error pages fetched from an image link', async () => {
        const upload = vi.fn().mockResolvedValue(uploadRes);
        registerImageUploadProviderFactory('test-hook-provider', () => createTestProvider(upload));
        setImageUploadConfigFromTenant({
            ...DEFAULT_LEARNCARD_TENANT_CONFIG,
            storage: { provider: 'test-hook-provider' } as unknown as TenantStorageConfig,
        } as TenantConfig);
        const results: Array<string | null> = [];
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response('Not found', { status: 404 }))
            .mockResolvedValueOnce(
                new Response('<html></html>', { headers: { 'content-type': 'text/html' } })
            )
            .mockResolvedValueOnce(
                new Response(new Uint8Array([137, 80, 78, 71]), {
                    headers: { 'content-type': 'image/png' },
                })
            );
        vi.stubGlobal('fetch', fetchMock);

        const TestComponent = () => {
            const { uploadImageFromUrl } = useImageUpload({});
            useEffect(() => {
                (async () => {
                    for (const url of ['/missing.ico', '/page.png', '/icon.png']) {
                        results.push(await uploadImageFromUrl(url));
                    }
                })();
            }, []);
            return null;
        };

        render(<TestComponent />);

        await waitFor(() => expect(results).toHaveLength(3));
        expect(results.slice(0, 2)).toEqual([null, null]);
        expect(upload).toHaveBeenCalledTimes(1);
        vi.unstubAllGlobals();
    });
});
