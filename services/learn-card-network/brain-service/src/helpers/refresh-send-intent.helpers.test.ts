import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@instance', () => ({ neogma: {} }));
vi.mock('./credential-refresh.helpers', () => ({}));

import {
    computeRefreshSendRequestDigest,
    matchesRefreshSendRequestDigest,
} from './refresh-send-intent.helpers';

describe('managed send metadata digest', () => {
    afterEach(() => vi.unstubAllEnvs());
    const request = { recipientProfileId: 'recipient', holderDid: 'did:example:holder' };

    it('matches current and retained keys without accepting removed keys or changed metadata', () => {
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_SECRET', 'old-send-test-key');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_KEY_VERSION', 'v1');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS', '{}');
        const stored = computeRefreshSendRequestDigest(request);
        expect(matchesRefreshSendRequestDigest(request, stored)).toBe(true);
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_SECRET', 'new-send-test-key');
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_KEY_VERSION', 'v2');
        vi.stubEnv(
            'CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS',
            JSON.stringify({ v1: 'old-send-test-key' })
        );
        expect(matchesRefreshSendRequestDigest(request, stored)).toBe(true);
        expect(
            matchesRefreshSendRequestDigest(request, computeRefreshSendRequestDigest(request))
        ).toBe(true);
        expect(
            matchesRefreshSendRequestDigest({ ...request, integrationId: 'other' }, stored)
        ).toBe(false);
        expect(computeRefreshSendRequestDigest(request)).toMatch(/^v1:[A-Za-z0-9_-]{43}$/);
        vi.stubEnv('CREDENTIAL_REFRESH_DIGEST_PREVIOUS_KEYS', '{}');
        expect(matchesRefreshSendRequestDigest(request, stored)).toBe(false);
    });

    it('ignores claim content and uses a versioned HMAC', () => {
        const original = {
            ...request,
            template: { name: 'PRIVATE' },
            templateData: { grade: 'A' },
        };
        const changed = { ...request, template: { name: 'OTHER' }, templateData: { grade: 'F' } };
        expect(computeRefreshSendRequestDigest(original)).toMatch(/^v1:[A-Za-z0-9_-]{43}$/);
        expect(computeRefreshSendRequestDigest(original)).toBe(
            computeRefreshSendRequestDigest(changed)
        );
    });

    it('binds explicitly public display and routing metadata', () => {
        expect(
            computeRefreshSendRequestDigest({ ...request, display: { name: 'Public' } })
        ).not.toBe(computeRefreshSendRequestDigest(request));
        expect(computeRefreshSendRequestDigest({ ...request, integrationId: 'other' })).not.toBe(
            computeRefreshSendRequestDigest(request)
        );
    });
});
