import { describe, it, expect, beforeEach } from 'vitest';

import type { NewSessionInput } from '@session/store';
import { InMemoryRedis, SessionStore } from '@session';
import { signSessionCookie, readSessionCookie } from '@session/cookie';

const baseInput = (overrides: Partial<NewSessionInput> = {}): NewSessionInput => ({
    tenantId: 'lef',
    providerId: 'lef-oidc',
    providerKind: 'oidc',
    externalSubject: 'auth0|abc',
    profileId: 'profile-1',
    managedDid: 'did:web:console.lef.org:p:01',
    effectiveAccess: { ecosystemRoles: [], scopes: [] },
    assuranceLevel: 'standard',
    ...overrides,
});

describe('SessionStore', () => {
    let store: SessionStore;

    beforeEach(() => {
        store = new SessionStore({ redis: new InMemoryRedis(), minTtlSeconds: 60 });
    });

    it('creates, stamps, and reads back a session', async () => {
        const session = await store.create(baseInput(), 3600);

        expect(session.sessionId).toBeTruthy();
        expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());

        const loaded = await store.get(session.sessionId);

        expect(loaded?.profileId).toBe('profile-1');
        expect(loaded?.managedDid).toBe('did:web:console.lef.org:p:01');
    });

    it('enforces the minimum TTL floor', async () => {
        const store5 = new SessionStore({ redis: new InMemoryRedis() });
        const session = await store5.create(baseInput(), 10);

        const ttlMs = new Date(session.expiresAt).getTime() - Date.now();

        expect(ttlMs).toBeGreaterThan(290 * 1000);
    });

    it('returns null for an expired session (destroy-on-read)', async () => {
        const redis = new InMemoryRedis();
        const expiringStore = new SessionStore({ redis, minTtlSeconds: 60 });
        const session = await expiringStore.create(baseInput(), 60);

        await redis.set(
            `console-session:${session.sessionId}`,
            JSON.stringify({ ...session, expiresAt: new Date(Date.now() - 1000).toISOString() }),
            'EX',
            60
        );

        expect(await expiringStore.get(session.sessionId)).toBeNull();
    });

    it('destroys a single session', async () => {
        const session = await store.create(baseInput(), 3600);

        await store.destroy(session.sessionId);

        expect(await store.get(session.sessionId)).toBeNull();
    });

    it('revokes every session for a profile', async () => {
        const a = await store.create(baseInput(), 3600);
        const b = await store.create(baseInput(), 3600);

        const revoked = await store.destroyAllForProfile('profile-1');

        expect(revoked).toBe(2);
        expect(await store.get(a.sessionId)).toBeNull();
        expect(await store.get(b.sessionId)).toBeNull();
    });

    it('refreshes TTL without changing identity', async () => {
        const session = await store.create(baseInput(), 3600);
        const refreshed = await store.refresh(session.sessionId, 7200);

        expect(refreshed?.sessionId).toBe(session.sessionId);
        expect(new Date(refreshed!.expiresAt).getTime()).toBeGreaterThanOrEqual(
            new Date(session.expiresAt).getTime()
        );
    });
});

describe('session cookie', () => {
    it('round-trips a signed session id', () => {
        const cookie = signSessionCookie('session-123', 'top-secret');

        expect(readSessionCookie(cookie, 'top-secret')).toBe('session-123');
    });

    it('rejects a tampered signature', () => {
        const cookie = signSessionCookie('session-123', 'top-secret');

        expect(readSessionCookie(`${cookie}x`, 'top-secret')).toBeNull();
        expect(readSessionCookie(cookie, 'wrong-secret')).toBeNull();
    });

    it('rejects malformed cookies', () => {
        expect(readSessionCookie(undefined, 's')).toBeNull();
        expect(readSessionCookie('no-signature', 's')).toBeNull();
    });
});
