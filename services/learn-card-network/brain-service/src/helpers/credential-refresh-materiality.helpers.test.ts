import { describe, expect, it } from 'vitest';

import {
    computeCredentialSubjectDigest,
    computeCredentialRefreshInitialDeliveryKey,
    computeCredentialRefreshRouteKey,
} from './credential-refresh-materiality.helpers';

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
