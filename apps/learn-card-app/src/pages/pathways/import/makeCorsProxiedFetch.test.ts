import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getResolvedTenantConfig: vi.fn(),
}));

vi.mock('../../../config/bootstrapTenantConfig', () => ({
    getResolvedTenantConfig: mocks.getResolvedTenantConfig,
}));

import { makeCorsProxiedFetch } from './makeCorsProxiedFetch';

describe('makeCorsProxiedFetch', () => {
    beforeEach(() => {
        mocks.getResolvedTenantConfig.mockReset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('falls back to direct fetch when tenant config is not bootstrapped', async () => {
        const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
        vi.stubGlobal('fetch', fetchSpy);
        mocks.getResolvedTenantConfig.mockImplementation(() => {
            throw new Error('TenantConfig not yet resolved');
        });

        const proxiedFetch = makeCorsProxiedFetch({ forceWeb: true });

        expect(mocks.getResolvedTenantConfig).not.toHaveBeenCalled();

        await expect(proxiedFetch('https://example.com/credential')).resolves.toBeInstanceOf(
            Response
        );
        expect(mocks.getResolvedTenantConfig).toHaveBeenCalledOnce();
        expect(fetchSpy).toHaveBeenCalledWith(
            'https://example.com/credential',
            expect.objectContaining({
                headers: expect.objectContaining({ Accept: 'application/json' }),
            })
        );
    });
});
