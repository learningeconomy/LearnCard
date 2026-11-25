import { describe, expect, it, vi } from 'vitest';
import { ProvisionError } from './errors';
import { checkIdToken, createLoginClient } from './login';

const options = {
    serverUrl: 'https://api.example.invalid/api',
    tenantId: 'test',
    firebaseApiKey: 'test-api-key',
};
const client = (respond: (url: string, init?: RequestInit) => Response) => {
    const transport = vi.fn<typeof fetch>(async (url, init) => respond(String(url), init));
    return { transport, login: createLoginClient({ ...options, transport }) };
};
const reason = async (promise: Promise<unknown>) => {
    try {
        await promise;
    } catch (error) {
        expect(error).toBeInstanceOf(ProvisionError);
        return (error as ProvisionError).message;
    }
    throw new Error('expected failure');
};
const jwt = (claims: Record<string, unknown>) =>
    `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.sig`;

describe('lca-api email-code login', () => {
    it('sends like the app: REST path, tenant header, English locale', async () => {
        const { transport, login } = client(() => Response.json({ success: true }));
        await login.sendCode('canary+1@example.test');
        const [url, init] = transport.mock.calls[0];
        expect(url).toBe('https://api.example.invalid/api/send-login-verification-code');
        expect(init?.headers).toMatchObject({ 'X-Tenant-Id': 'test' });
        expect(JSON.parse(String(init?.body))).toEqual({
            email: 'canary+1@example.test',
            locale: 'en',
        });
    });

    it.each([
        ['Too many login attempts. Try again in a few minutes.', 'send: rate_limited'],
        ['Error sending login verification code', 'send: delivery_refused'],
        ['An error occurred. Please try again.', 'send: refused'],
    ])('reads success:false at HTTP 200 (%s)', async (error, expected) => {
        const { login } = client(() => Response.json({ success: false, error }));
        expect(await reason(login.sendCode('a@example.test'))).toBe(expected);
    });

    it.each([
        [400, 'send: http_refusal'],
        [429, 'send: rate_limited'],
        [503, 'send: unavailable'],
    ])('maps HTTP %s', async (status, expected) => {
        const { login } = client(() => new Response('{"private":"x"}', { status }));
        expect(await reason(login.sendCode('a@example.test'))).toBe(expected);
    });

    it('returns the custom token on verify and refuses bad input before sending', async () => {
        const { transport, login } = client(() =>
            Response.json({ success: true, token: 'custom' })
        );
        expect(await login.verifyCode('a@example.test', '123456')).toBe('custom');
        expect(await reason(login.verifyCode('a@example.test', '12345'))).toBe(
            'verify: code_format'
        );
        expect(transport).toHaveBeenCalledTimes(1);
    });

    it.each([
        ['Invalid or expired code.', 'verify: rejected'],
        ['Too many attempts. Please resend code.', 'verify: rate_limited'],
    ])('maps verify failure %s without echoing it', async (error, expected) => {
        const { login } = client(() => Response.json({ success: false, error }));
        expect(await reason(login.verifyCode('a@example.test', '123456'))).toBe(expected);
    });

    it('exchanges the custom token with the public web API key', async () => {
        const { transport, login } = client(() =>
            Response.json({ idToken: 'id', refreshToken: 'refresh', expiresIn: '3600' })
        );
        expect(await login.exchange('custom')).toEqual({ idToken: 'id', refreshToken: 'refresh' });
        const [url, init] = transport.mock.calls[0];
        expect(url).toBe(
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=test-api-key'
        );
        expect(JSON.parse(String(init?.body))).toEqual({
            token: 'custom',
            returnSecureToken: true,
        });
    });

    it.each([
        ['INVALID_CUSTOM_TOKEN : detail', 'exchange: INVALID_CUSTOM_TOKEN'],
        ['CREDENTIAL_MISMATCH', 'exchange: CREDENTIAL_MISMATCH'],
        ['SOMETHING private custom-token-value', 'exchange: refused'],
    ])('maps Firebase error %s to an allowlist', async (message, expected) => {
        const { login } = client(() =>
            Response.json({ error: { code: 400, message } }, { status: 400 })
        );
        expect(await reason(login.exchange('custom'))).toBe(expected);
    });

    it('turns transport failures into fixed reasons', async () => {
        const login = createLoginClient({
            ...options,
            transport: async () => {
                throw new Error('private token in message');
            },
        });
        expect(await reason(login.sendCode('a@example.test'))).toBe('send: transport');
    });
});

describe('ID token check', () => {
    const now = Date.UTC(2026, 9, 30);
    const good = {
        iss: 'https://securetoken.google.com/proj',
        aud: 'proj',
        exp: now / 1000 + 3600,
        email: 'Canary+1@Example.test',
    };
    it('accepts the right user and project', () => {
        expect(() => checkIdToken(jwt(good), 'canary+1@example.test', now, 'proj')).not.toThrow();
    });
    it.each([
        ['email', { email: 'other@example.test' }, 'token: email'],
        ['missing email', { email: undefined }, 'token: email'],
        ['issuer', { iss: 'https://evil.example/proj' }, 'token: issuer'],
        [
            'project',
            { aud: 'other', iss: 'https://securetoken.google.com/other' },
            'token: project',
        ],
        ['expiry', { exp: now / 1000 - 1 }, 'token: expired'],
    ])('refuses a wrong %s', (_name, change, expected) => {
        expect(() =>
            checkIdToken(jwt({ ...good, ...change }), 'canary+1@example.test', now, 'proj')
        ).toThrow(expected);
    });
    it('refuses a malformed token', () => {
        expect(() => checkIdToken('not-a-jwt', 'a@example.test', now)).toThrow('token: malformed');
    });
});
