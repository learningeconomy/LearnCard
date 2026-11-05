import { describe, expect, it, vi } from 'vitest';

vi.mock('@instance', () => ({ neogma: {} }));
vi.mock('./credential-refresh.helpers', () => ({}));
vi.mock('./credential-refresh-materiality.helpers', () => ({
    getCredentialRefreshDigestSecret: () => 'test-only-secret',
}));

import { computeRefreshSendRequestDigest } from './refresh-send-intent.helpers';

describe('managed send metadata digest', () => {
    const request = { recipientProfileId: 'recipient', holderDid: 'did:example:holder' };

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
