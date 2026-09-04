import { beforeEach, describe, expect, it, vi } from 'vitest';

import cache from '@cache';

import {
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
});
