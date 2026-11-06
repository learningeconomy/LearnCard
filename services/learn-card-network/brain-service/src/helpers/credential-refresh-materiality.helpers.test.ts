import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    computeCredentialMaterialDigest,
    matchesCredentialMaterialDigest,
    matchesCredentialSubjectDigest,
    getCredentialRefreshDigestCandidateSecrets,
    decideCredentialRefreshNotification,
    computeCredentialSubjectDigest,
    computeCredentialStatusDigest,
    matchesCredentialStatusDigest,
    computeCredentialRefreshInitialDeliveryKey,
    computeCredentialRefreshRouteKey,
} from './credential-refresh-materiality.helpers';

describe('versioned status fingerprints', () => {
    afterEach(() => vi.unstubAllEnvs());

    it('matches current-version digests without parsing previous keys', () => {
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_KEY_VERSION', 'v2');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_SECRET', 'current-test-key');
        const status = { type: 'BitstringStatusListEntry', statusPurpose: 'revocation' };
        const digest = computeCredentialStatusDigest(status);
        // Startup validation is separate; current matches never consult old keys.
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS', 'invalid-json');
        expect(getCredentialRefreshDigestCandidateSecrets('v2')).toEqual(['current-test-key']);
        expect(matchesCredentialStatusDigest(status, digest)).toBe(true);
        expect(() => getCredentialRefreshDigestCandidateSecrets('v1')).toThrow();
    });

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

describe('subject and material digest key rotation', () => {
    afterEach(() => vi.unstubAllEnvs());

    it.each([false, true])('matches retained old keys (version prefix: %s)', prefixed => {
        const subject = { id: 'holder' };
        const credential = { credentialSubject: subject, name: 'Original' };
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_SECRET', 'old-test-key');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_KEY_VERSION', 'v1');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS', '{}');
        const prefix = prefixed ? 'v1:' : '';
        const subjectDigest = prefix + computeCredentialSubjectDigest(subject);
        const materialDigest = prefix + computeCredentialMaterialDigest(credential);

        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_SECRET', 'new-test-key');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_KEY_VERSION', 'v2');
        vi.stubEnv(
            'CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS',
            JSON.stringify({ v1: 'old-test-key' })
        );
        expect(getCredentialRefreshDigestCandidateSecrets()).toEqual([
            'new-test-key',
            'old-test-key',
        ]);
        expect(matchesCredentialSubjectDigest(subject, subjectDigest)).toBe(true);
        expect(matchesCredentialMaterialDigest(credential, materialDigest)).toBe(true);
        expect(matchesCredentialSubjectDigest({ id: 'other' }, subjectDigest)).toBe(false);
        expect(
            matchesCredentialMaterialDigest({ ...credential, name: 'Changed' }, materialDigest)
        ).toBe(false);
        expect(matchesCredentialSubjectDigest(subject, `unknown:${subjectDigest}`)).toBe(false);
        expect(matchesCredentialMaterialDigest(credential, `unknown:${materialDigest}`)).toBe(
            false
        );
        const nextDigest = computeCredentialMaterialDigest(credential);
        expect(nextDigest).toBe(computeCredentialMaterialDigest(credential, 'new-test-key'));
        expect(computeCredentialSubjectDigest(subject)).toBe(
            computeCredentialSubjectDigest(subject, 'new-test-key')
        );
        expect(
            decideCredentialRefreshNotification({
                state: 'active',
                previousDigest: matchesCredentialMaterialDigest(credential, materialDigest)
                    ? nextDigest
                    : materialDigest,
                nextDigest,
            })
        ).toBe('suppressed');

        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS', '{}');
        expect(matchesCredentialSubjectDigest(subject, subjectDigest)).toBe(false);
        expect(matchesCredentialMaterialDigest(credential, materialDigest)).toBe(false);
    });

    it('rejects missing digests and mismatched version prefixes', () => {
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_SECRET', 'current-test-key');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_KEY_VERSION', 'v2');
        vi.stubEnv(
            'CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS',
            JSON.stringify({ v1: 'old-test-key' })
        );
        const subject = { id: 'holder' };
        const credential = { credentialSubject: subject };
        expect(matchesCredentialSubjectDigest(subject)).toBe(false);
        expect(matchesCredentialMaterialDigest(credential, '')).toBe(false);
        expect(
            matchesCredentialSubjectDigest(subject, `v1:${computeCredentialSubjectDigest(subject)}`)
        ).toBe(false);
        expect(
            matchesCredentialMaterialDigest(
                credential,
                `v1:${computeCredentialMaterialDigest(credential)}`
            )
        ).toBe(false);
        expect(
            matchesCredentialSubjectDigest(subject, `v2:${computeCredentialSubjectDigest(subject)}`)
        ).toBe(true);
        expect(
            matchesCredentialMaterialDigest(
                credential,
                `v2:${computeCredentialMaterialDigest(credential)}`
            )
        ).toBe(true);
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
