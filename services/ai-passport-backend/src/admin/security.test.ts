import { expect, test } from 'bun:test';
import { csrfToken, isServicePrincipal, isFreshAdmin, validAdminMutation } from './security';
const origin = 'https://passport.example.test',
    id = 'opaque-random-session';
const request = (changes: Record<string, string> = {}) =>
    new Request(`${origin}/admin/embeddings/jobs`, {
        method: 'POST',
        headers: {
            Origin: origin,
            'Content-Type': 'application/json',
            'X-Passport-CSRF': csrfToken(id, origin),
            ...changes,
        },
        body: '{}',
    });
test('authority is exact service profile equality and never a submitted DID', () => {
    expect(
        isServicePrincipal({ did: 'did:web:passport' }, 'did:web:passport', 'did:web:passport')
    ).toBe(true);
    for (const session of [null, { did: 'did:key:manager' }, { did: 'did:web:attacker' }])
        expect(isServicePrincipal(session, 'did:web:passport', 'did:web:passport')).toBe(false);
    expect(isServicePrincipal({ did: 'did:web:passport' }, '', 'did:web:passport')).toBe(false);
    expect(
        isServicePrincipal({ did: 'did:web:passport' }, 'did:web:passport', 'did:key:fallback')
    ).toBe(false);
});
test('old, absent and future proof timestamps cannot start admin work', () => {
    expect(isFreshAdmin({ authenticatedAt: 1000 }, 1001)).toBe(true);
    expect(isFreshAdmin({}, 1001)).toBe(false);
    expect(isFreshAdmin({ authenticatedAt: 1002 }, 1001)).toBe(false);
    expect(isFreshAdmin({ authenticatedAt: 1000 }, 301001)).toBe(false);
});
test('exact origin, content type and session-bound CSRF are jointly required', () => {
    expect(validAdminMutation(request(), id, [origin])).toBe(true);
    for (const headers of [
        { Origin: 'https://passport.example.test.evil' },
        { Origin: 'null' },
        { Origin: '' },
        { 'X-Passport-CSRF': '' },
        { 'X-Passport-CSRF': csrfToken('other-session', origin) },
        { 'Content-Type': 'text/plain' },
    ])
        expect(
            validAdminMutation(request(headers as unknown as Record<string, string>), id, [origin])
        ).toBe(false);
});
