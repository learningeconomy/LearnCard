import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    computeCredentialSubjectDigest,
    computeCredentialStatusDigest,
    matchesCredentialStatusDigest,
    computeCredentialRefreshInitialDeliveryKey,
    computeCredentialRefreshRouteKey,
} from './credential-refresh-materiality.helpers';

describe('versioned status fingerprints', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('retains shape, array order and fields, and accepts unversioned current-key digests', () => {
        const status = { type: 'BitstringStatusListEntry', statusPurpose: 'revocation' };
        const digest = computeCredentialStatusDigest(status);
        expect(digest).toMatch(/^v1:/);
        expect(matchesCredentialStatusDigest(status, digest)).toBe(true);
        expect(matchesCredentialStatusDigest(status, digest.split(':')[1])).toBe(true);
        expect(matchesCredentialStatusDigest([status], digest)).toBe(false);
        expect(matchesCredentialStatusDigest({ ...status, extra: true }, digest)).toBe(false);
        expect(
            matchesCredentialStatusDigest([status, {}], computeCredentialStatusDigest([{}, status]))
        ).toBe(false);
    });

    it('accepts only current or explicitly retained previous keys', () => {
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_SECRET', 'old-test-key');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_KEY_VERSION', 'v1');
        const digest = computeCredentialStatusDigest({ type: 'example' });
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_SECRET', 'new-test-key');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_KEY_VERSION', 'v2');
        vi.stubEnv(
            'CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS',
            JSON.stringify({ v1: 'old-test-key' })
        );
        expect(matchesCredentialStatusDigest({ type: 'example' }, digest)).toBe(true);
        expect(matchesCredentialStatusDigest({ type: 'example' }, digest.split(':')[1])).toBe(true);
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS', '{}');
        expect(matchesCredentialStatusDigest({ type: 'example' }, digest)).toBe(false);
    });
});

describe('managed initial credential notification keys', () => {
    it('derives a stable opaque initial-delivery key from the refresh route key', () => {
        const secret = 'test-secret';
        const routeKey = computeCredentialRefreshRouteKey('refresh-1', secret);
        const deliveryKey = computeCredentialRefreshInitialDeliveryKey('refresh-1', secret);

        expect(computeCredentialRefreshInitialDeliveryKey('refresh-1', secret)).toBe(deliveryKey);
        expect(computeCredentialRefreshInitialDeliveryKey('refresh-2', secret)).not.toBe(
            deliveryKey
        );
        expect(deliveryKey).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(deliveryKey).not.toContain('refresh-1');
        expect(deliveryKey).not.toBe(routeKey);
    });
});

describe('subject identity fingerprint', () => {
    it('normalizes subject order and object/array form but rejects additions and removals', () => {
        const digest = (subject: unknown) => computeCredentialSubjectDigest(subject, 'test-secret');
        expect(digest({ id: 'holder' })).toBe(digest([{ id: 'holder' }]));
        expect(digest([{ id: 'holder' }, { id: 'other' }])).toBe(
            digest([{ id: 'other' }, { id: 'holder' }])
        );
        expect(digest([{ id: 'holder' }, { id: 'other' }])).not.toBe(digest({ id: 'holder' }));
        expect(digest([{ id: 'holder' }, {}])).not.toBe(digest({ id: 'holder' }));
    });
});
