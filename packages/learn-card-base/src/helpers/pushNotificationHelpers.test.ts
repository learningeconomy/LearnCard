import { describe, expect, it, vi } from 'vitest';

import type { LCNNotification } from '@learncard/types';

// The helper only imports types from the push plugin; stub the module so the
// Capacitor web runtime is never evaluated under the node test environment.
vi.mock('@capacitor/push-notifications', () => ({}));

import {
    getNotificationToastCopy,
    handlePushNotificationActionPerformed,
    parseNotificationFromPushRaw,
    resolveNotificationRoute,
} from './pushNotificationHelpers';

/**
 * CREDENTIAL_REFRESHED push routing (LC-2117, LC-2135, LC-2136 Task 14).
 *
 * Refresh notifications carry opaque routing metadata only — refreshId, version,
 * routeKey, deliveryKey. The deep link must be claim-free (no credential URI, no
 * claim action), URL-encoded, and fall back safely when the payload is missing or
 * malformed. Subject data from the payload must never reach the route or toast.
 */

const HOLDER = { did: 'did:key:holder', profileId: 'holder' };

const ISSUER = { did: 'did:key:issuer', profileId: 'issuer', displayName: 'Issuer University' };

const refreshedNotification = (
    metadata: Record<string, unknown> | undefined,
    overrides: Record<string, unknown> = {}
): LCNNotification =>
    ({
        type: 'CREDENTIAL_REFRESHED',
        to: HOLDER,
        from: ISSUER,
        data: metadata === undefined ? {} : { metadata },
        ...overrides,
    }) as unknown as LCNNotification;

describe('resolveNotificationRoute — CREDENTIAL_REFRESHED', () => {
    it('maps to the claim-free refresh route carrying only the encoded refreshId', () => {
        const route = resolveNotificationRoute(
            refreshedNotification({ refreshId: 'refresh-123', version: 2 })
        );

        expect(route).toBe('/notifications?refreshId=refresh-123&refresh=true');

        // Claim-free: unlike received-credential routes, no credential URI and no
        // claim action ever appear in the refresh route.
        expect(route).not.toContain('claim');
        expect(route).not.toContain('uri=');
    });

    it('URL-encodes the refreshId so route values cannot be smuggled in', () => {
        const hostile = 'id/with?slashes&claim=true&uri=lc:evil';

        const route = resolveNotificationRoute(refreshedNotification({ refreshId: hostile }));

        expect(route).toBe(`/notifications?refreshId=${encodeURIComponent(hostile)}&refresh=true`);

        const params = new URLSearchParams(route.split('?')[1]);

        expect(params.get('refreshId')).toBe(hostile);
        expect(params.get('refresh')).toBe('true');
        // The smuggled params must not materialize as real route values.
        expect(params.get('claim')).toBeNull();
        expect(params.get('uri')).toBeNull();
        expect([...params.keys()].sort()).toEqual(['refresh', 'refreshId']);
    });

    it('never leaks subject or body payload data into the route', () => {
        const route = resolveNotificationRoute(
            refreshedNotification({
                refreshId: 'refresh-123',
                version: 3,
                routeKey: 'route-key',
                deliveryKey: 'delivery-key',
                credentialSubject: { name: 'Alice Example' },
                credentialTitle: 'Secret Credential Title',
            })
        );

        expect(route).not.toContain('Alice');
        expect(route).not.toContain('Secret');
        expect(route).not.toContain('route-key');
        expect(route).not.toContain('delivery-key');
        expect(route).toBe('/notifications?refreshId=refresh-123&refresh=true');
    });

    it('falls back to the notifications list when refreshId is missing or malformed', () => {
        expect(resolveNotificationRoute(refreshedNotification(undefined))).toBe('/notifications');
        expect(resolveNotificationRoute(refreshedNotification({}))).toBe('/notifications');
        expect(resolveNotificationRoute(refreshedNotification({ refreshId: '' }))).toBe(
            '/notifications'
        );
        expect(resolveNotificationRoute(refreshedNotification({ refreshId: 42 }))).toBe(
            '/notifications'
        );
        expect(resolveNotificationRoute(refreshedNotification({ refreshId: null }))).toBe(
            '/notifications'
        );
        expect(
            resolveNotificationRoute(
                refreshedNotification({ refreshId: { nested: 'object' } } as never)
            )
        ).toBe('/notifications');
    });

    it('falls back safely for unrecognized notification types', () => {
        const unknown = {
            type: 'SOME_FUTURE_TYPE',
            to: HOLDER,
            from: ISSUER,
        } as unknown as LCNNotification;

        expect(resolveNotificationRoute(unknown)).toBe('/');
    });
});

describe('getNotificationToastCopy — CREDENTIAL_REFRESHED', () => {
    it('uses generic copy that does not identify the credential', () => {
        const copy = getNotificationToastCopy(refreshedNotification({ refreshId: 'r-1' }));

        expect(copy.title).toBe('Credential updated');
        expect(copy.body).toBe('Issuer University updated one of your credentials');
    });

    it('stays generic when the sender has no display name', () => {
        const copy = getNotificationToastCopy(
            refreshedNotification({ refreshId: 'r-1' }, { from: { did: 'did:key:issuer' } })
        );

        expect(copy.title).toBe('Credential updated');
        expect(copy.body).toBe('One of your credentials was updated');
    });

    it('prefers the server-provided generic message when present', () => {
        const copy = getNotificationToastCopy(
            refreshedNotification(
                { refreshId: 'r-1' },
                { message: { title: 'Credential updated', body: 'Issuer updated a credential' } }
            )
        );

        expect(copy).toEqual({
            title: 'Credential updated',
            body: 'Issuer updated a credential',
        });
    });

    it('never echoes payload metadata into the toast copy', () => {
        const copy = getNotificationToastCopy(
            refreshedNotification({
                refreshId: 'r-1',
                credentialSubject: { name: 'Alice Example' },
                credentialTitle: 'Secret Credential Title',
            })
        );

        expect(`${copy.title} ${copy.body}`).not.toContain('Alice');
        expect(`${copy.title} ${copy.body}`).not.toContain('Secret');
    });
});

describe('handlePushNotificationActionPerformed — CREDENTIAL_REFRESHED', () => {
    it('pushes the encoded refresh route for a well-formed payload', () => {
        const history = { push: vi.fn() };

        handlePushNotificationActionPerformed(
            {
                actionId: 'tap',
                notification: {
                    data: {
                        raw: JSON.stringify(refreshedNotification({ refreshId: 'refresh-9?&' })),
                    },
                },
            } as never,
            history as never
        );

        expect(history.push).toHaveBeenCalledWith(
            `/notifications?refreshId=${encodeURIComponent('refresh-9?&')}&refresh=true`
        );
    });

    it('does nothing for a malformed push payload', () => {
        const history = { push: vi.fn() };

        handlePushNotificationActionPerformed(
            { actionId: 'tap', notification: { data: { raw: '{not-json' } } } as never,
            history as never
        );

        expect(history.push).not.toHaveBeenCalled();
    });
});

describe('parseNotificationFromPushRaw', () => {
    it('round-trips a CREDENTIAL_REFRESHED payload without exposing subject data', () => {
        const parsed = parseNotificationFromPushRaw(
            JSON.stringify(refreshedNotification({ refreshId: 'r-1', version: 2 }))
        );

        expect(parsed?.type).toBe('CREDENTIAL_REFRESHED');
        expect(parsed?.data?.metadata).toMatchObject({ refreshId: 'r-1' });
    });
});
