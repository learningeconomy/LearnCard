import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('axios', () => ({ default: { get: mocks.get } }));
vi.mock('@environment', () => ({
    environment: { NETWORK_BRAIN_SERVICE_URL: 'http://brain.test/api' },
}));

import { getCurrentProfile } from './currentProfile';
import { isAnalyticsRestricted } from './analyticsEligibility';

const ctx = {
    authorizationHeader: 'Bearer signed-did-vp',
    tenant: { id: 'tenant-a' },
    user: { did: 'did:example:person' },
} as never;

describe('getCurrentProfile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-10-29T12:00:00Z'));
    });
    afterEach(() => vi.useRealTimers());

    it('keeps age authority when Brain rewrites the authenticated profile DID', async () => {
        mocks.get.mockResolvedValueOnce({
            data: { did: 'did:web:network.learncard.com:users:person', dob: '2010-01-01' },
        });
        expect(isAnalyticsRestricted((await getCurrentProfile(ctx))!)).toBe(true);
    });

    it('treats malformed profile authority as unknown rather than adult authority', async () => {
        mocks.get.mockResolvedValueOnce({ data: { dob: 2010, country: 'US' } });
        await expect(getCurrentProfile(ctx)).resolves.toBeNull();
    });

    it('fails closed when brain-service cannot resolve the profile without exposing transport details', async () => {
        mocks.get.mockRejectedValueOnce(new Error('private transport detail'));
        await expect(getCurrentProfile(ctx)).resolves.toBeNull();
    });

    it('accepts a self-profile without a DID field', async () => {
        mocks.get.mockResolvedValueOnce({ data: { dob: '1990-01-01' } });
        expect(isAnalyticsRestricted((await getCurrentProfile(ctx))!)).toBe(false);
    });

    it('treats an absent network profile as unknown rather than an adult', async () => {
        mocks.get.mockResolvedValueOnce({ data: undefined });
        await expect(getCurrentProfile(ctx)).resolves.toBeNull();
    });
});
