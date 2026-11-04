import { expect, test } from 'bun:test';
import { isCookieMutationOriginAllowed } from './cookieMutationOrigin';

const allowed = (origin: string) => origin === 'https://client.example.invalid';
const request = (method: string, headers: Record<string, string> = {}) =>
    new Request('https://api.example.invalid/threads', { method, headers });

for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    for (const origin of [
        undefined,
        'null',
        'https://attacker.example.invalid',
        'https://client.example.invalid.attacker.invalid',
    ]) {
        test(`${method} ambient cookie rejects ${origin ?? 'missing Origin'}`, () => {
            expect(
                isCookieMutationOriginAllowed(
                    request(method, {
                        cookie: 'unrelated=value; session=opaque-session',
                        ...(origin === undefined ? {} : { origin }),
                    }),
                    'session',
                    allowed,
                    'https://api.example.invalid'
                )
            ).toBe(false);
        });
    }
    test(`${method} permits exact trusted Origin`, () => {
        expect(
            isCookieMutationOriginAllowed(
                request(method, {
                    cookie: 'session=opaque-session',
                    origin: 'https://client.example.invalid',
                }),
                'session',
                allowed,
                'https://api.example.invalid'
            )
        ).toBe(true);
    });
}

test('bodyless simple POST is covered; empty cookies cannot bypass the boundary', () => {
    expect(
        isCookieMutationOriginAllowed(
            request('POST', { cookie: 'session=' }),
            'session',
            allowed,
            'https://api.example.invalid'
        )
    ).toBe(false);
});

for (const method of ['GET', 'HEAD', 'OPTIONS']) {
    test(`${method} remains available for navigation and preflight`, () => {
        expect(
            isCookieMutationOriginAllowed(
                request(method, { cookie: 'session=value' }),
                'session',
                allowed,
                'https://api.example.invalid'
            )
        ).toBe(true);
    });
}

test('explicit bearer keeps server credential precedence over incidental cookies', () => {
    expect(
        isCookieMutationOriginAllowed(
            request('POST', {
                cookie: 'session=value',
                authorization: 'BeArEr synthetic-explicit-token',
            }),
            'session',
            allowed,
            'https://api.example.invalid'
        )
    ).toBe(true);
});

test('non-bearer authorization does not bypass ambient cookie protection', () => {
    expect(
        isCookieMutationOriginAllowed(
            request('POST', {
                cookie: 'session=value',
                authorization: 'Basic synthetic',
            }),
            'session',
            allowed,
            'https://api.example.invalid'
        )
    ).toBe(false);
});

test('unrelated cookie and unauthenticated clients still reach authentication', () => {
    expect(
        isCookieMutationOriginAllowed(
            request('POST', { cookie: 'prefix-session=value' }),
            'session',
            allowed,
            'https://api.example.invalid'
        )
    ).toBe(true);
    expect(
        isCookieMutationOriginAllowed(
            request('POST'),
            'session',
            allowed,
            'https://api.example.invalid'
        )
    ).toBe(true);
});

test('same-origin fragment callback permits reauthentication with existing cookie', () => {
    const callback = new Request(
        'https://api.example.invalid/auth/callback?response_mode=fragment',
        {
            method: 'POST',
            headers: { cookie: 'session=existing', origin: 'https://api.example.invalid' },
        }
    );
    expect(
        isCookieMutationOriginAllowed(callback, 'session', allowed, 'https://api.example.invalid')
    ).toBe(true);
    expect(
        isCookieMutationOriginAllowed(
            callback,
            'session',
            allowed,
            'https://different-api.example.invalid'
        )
    ).toBe(false);
});
