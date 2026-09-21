import { describe, expect, it, vi } from 'vitest';

import {
    composeShareLinkPolicy,
    createShareLinkPolicyResolver,
    resolveShareLinkExpiry,
} from '@helpers/share-link-policy/resolver';
import { DEFAULT_SHARE_LINK_POLICY } from '@helpers/share-link-policy/types';
import { resolveShareLinkOwnerApiConfig } from '@helpers/share-link-owner/config';

describe('share-link policy decision table', () => {
    it('gives a known unmanaged adult 365 days and view counting', () => {
        expect(composeShareLinkPolicy('adult', false)).toEqual({
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 365,
            viewCountingEnabled: true,
        });
    });

    it('treats a managed adult as no-views/30-days', () => {
        expect(composeShareLinkPolicy('adult', true)).toEqual({
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 30,
            viewCountingEnabled: false,
        });
    });

    it('treats a known minor as no-views/30-days regardless of management', () => {
        for (const managed of [true, false]) {
            expect(composeShareLinkPolicy('minor', managed)).toEqual({
                isMinor: true,
                policyResolved: true,
                defaultExpiryDays: 30,
                viewCountingEnabled: false,
            });
        }
    });

    it('treats unknown age as no-views/30-days and never infers adult from absence of a manager', () => {
        expect(composeShareLinkPolicy('unknown', false)).toEqual(DEFAULT_SHARE_LINK_POLICY);
        expect(composeShareLinkPolicy('unknown', true)).toEqual(DEFAULT_SHARE_LINK_POLICY);
    });
});

describe('createShareLinkPolicyResolver', () => {
    it('fails closed to the conservative default when a source throws', async () => {
        const resolver = createShareLinkPolicyResolver({
            resolveOwnerAge: vi.fn().mockRejectedValue(new Error('age source down')),
            isManaged: vi.fn().mockResolvedValue(false),
        });

        await expect(resolver.resolve('owner-1')).resolves.toEqual(DEFAULT_SHARE_LINK_POLICY);
    });

    it('never returns an adult policy when the age source is unknown', async () => {
        const resolver = createShareLinkPolicyResolver({
            resolveOwnerAge: vi.fn().mockResolvedValue('unknown'),
            isManaged: vi.fn().mockResolvedValue(false),
        });

        const policy = await resolver.resolve('owner-1');
        expect(policy.viewCountingEnabled).toBe(false);
        expect(policy.defaultExpiryDays).toBe(30);
    });
});

describe('resolveShareLinkExpiry', () => {
    const now = new Date('2026-09-21T00:00:00.000Z');

    it('derives the policy default only when expiresAt is omitted', () => {
        expect(resolveShareLinkExpiry(DEFAULT_SHARE_LINK_POLICY, undefined, now)).toBe(
            '2026-10-21T00:00:00.000Z'
        );
        expect(resolveShareLinkExpiry(composeShareLinkPolicy('adult', false), undefined, now)).toBe(
            '2027-09-21T00:00:00.000Z'
        );
    });

    it('preserves an explicit null (no expiry) and an explicit date', () => {
        expect(resolveShareLinkExpiry(DEFAULT_SHARE_LINK_POLICY, null, now)).toBeNull();
        expect(
            resolveShareLinkExpiry(DEFAULT_SHARE_LINK_POLICY, '2030-01-01T00:00:00.000Z', now)
        ).toBe('2030-01-01T00:00:00.000Z');
    });
});

describe('resolveShareLinkOwnerApiConfig (fail closed)', () => {
    const enabledRaw = (overrides: Record<string, unknown> = {}) => ({
        SHARE_LINK_MAINTENANCE_NAMESPACE: 'deployment-ns',
        SHARE_LINK_MAINTENANCE_ORIGIN: 'https://learncloud.test',
        SHARE_LINK_MAINTENANCE_AUDIENCE: 'did:web:brain.test',
        ...overrides,
    });

    it('does no setup without service wiring', () => {
        expect(resolveShareLinkOwnerApiConfig({})).toEqual({ status: 'disabled' });
        expect(resolveShareLinkOwnerApiConfig({ SHARE_LINK_MAINTENANCE_NAMESPACE: '' })).toEqual({
            status: 'disabled',
        });
    });

    it('rejects incomplete service-client configuration', () => {
        expect(resolveShareLinkOwnerApiConfig({ SHARE_LINK_MAINTENANCE_NAMESPACE: 'ns' })).toEqual({
            status: 'invalid',
        });
    });

    it('is invalid when the owner namespace disagrees with the service client namespace', () => {
        expect(
            resolveShareLinkOwnerApiConfig(
                enabledRaw({ SHARE_LINK_OWNER_API_NAMESPACE: 'other-ns' })
            )
        ).toEqual({ status: 'invalid' });
    });

    it('ignores the retired owner rollout flag', () => {
        expect(
            resolveShareLinkOwnerApiConfig(enabledRaw({ SHARE_LINK_OWNER_API_ENABLED: 'false' }))
        ).toMatchObject({ status: 'enabled', namespace: 'deployment-ns' });
    });

    it('enables with the trusted service-client namespace when it matches', () => {
        expect(resolveShareLinkOwnerApiConfig(enabledRaw())).toMatchObject({
            status: 'enabled',
            namespace: 'deployment-ns',
        });
        expect(
            resolveShareLinkOwnerApiConfig(
                enabledRaw({ SHARE_LINK_OWNER_API_NAMESPACE: 'deployment-ns' })
            )
        ).toMatchObject({ status: 'enabled', namespace: 'deployment-ns' });
    });
});
