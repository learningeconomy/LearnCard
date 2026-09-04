import { beforeEach, describe, expect, it, vi } from 'vitest';

import cache from '@cache';

import {
    enforceCredentialRefreshPreAuthRateLimit,
    issueCredentialRefreshChallenge,
    verifyCredentialRefreshAuthorization,
} from './credential-refresh-auth.helpers';

vi.mock('./learnCard.helpers', () => ({
    getEmptyLearnCard: vi.fn(async () => ({
        invoke: {
            verifyPresentation: async () => ({
                checks: ['JWS'],
                errors: [],
                warnings: [],
            }),
        },
    })),
}));

const toJwt = (payload: Record<string, unknown>): string => {
    const encode = (value: Record<string, unknown>): string =>
        Buffer.from(JSON.stringify(value)).toString('base64url');

    return `${encode({ alg: 'none' })}.${encode(payload)}.signature`;
};

describe('credential refresh DID challenges', () => {
    beforeEach(async () => {
        await cache.node.flushall();
    });

    it('allows exactly one concurrent verifier to consume a single-use challenge', async () => {
        const refreshId = 'refresh-id';
        const domain = 'network.example.com';
        const { challenge } = await issueCredentialRefreshChallenge(refreshId, domain);
        const authorization = `Bearer ${toJwt({
            aud: domain,
            nonce: challenge,
            vp: { holder: 'did:key:holder' },
        })}`;

        const results = await Promise.all([
            verifyCredentialRefreshAuthorization(refreshId, authorization, domain),
            verifyCredentialRefreshAuthorization(refreshId, authorization, domain),
        ]);

        expect(results.filter(result => result.authenticated)).toHaveLength(1);
        expect(results.filter(result => !result.authenticated)).toHaveLength(1);
    });

    it('limits one source across distinct refresh IDs', async () => {
        await enforceCredentialRefreshPreAuthRateLimit('192.0.2.1', 'refresh-a', 1000, 2);
        await enforceCredentialRefreshPreAuthRateLimit('192.0.2.1', 'refresh-b', 1000, 2);

        await expect(
            enforceCredentialRefreshPreAuthRateLimit('192.0.2.1', 'refresh-c', 1000, 2)
        ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    });
});
