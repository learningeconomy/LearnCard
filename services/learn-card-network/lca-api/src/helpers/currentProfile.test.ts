import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('axios', () => ({ default: { get: mocks.get } }));
vi.mock('@environment', () => ({
    environment: { NETWORK_BRAIN_SERVICE_URL: 'http://brain.test/api' },
}));

import { getCurrentProfile } from './currentProfile';

const ctx = {
    authorizationHeader: 'Bearer signed-did-vp',
    tenant: { id: 'tenant-a' },
    user: { did: 'did:example:person' },
} as never;

describe('getCurrentProfile', () => {
    beforeEach(() => vi.clearAllMocks());

    it('accepts the authenticated profile DID returned for the brain-service domain', async () => {
        mocks.get.mockResolvedValueOnce({
            data: { did: 'did:web:network.learncard.com:users:person', dob: '2010-01-01' },
        });
        await expect(getCurrentProfile(ctx)).resolves.toMatchObject({ dob: '2010-01-01' });
    });

    it('rejects malformed profile authority rather than treating it as an adult profile', async () => {
        mocks.get.mockResolvedValueOnce({ data: { dob: 2010, country: 'US' } });
        await expect(getCurrentProfile(ctx)).rejects.toThrow('Unable to resolve current profile');
    });

    it('fails closed when brain-service cannot resolve the profile without exposing transport details', async () => {
        mocks.get.mockRejectedValueOnce(new Error('private transport detail'));
        await expect(getCurrentProfile(ctx)).rejects.toThrow('Unable to resolve current profile');
    });
});
