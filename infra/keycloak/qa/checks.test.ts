import { afterEach, expect, mock, test } from 'bun:test';
import { checkProduction } from './prod-check';
import { signIn } from './signin';
import { record, secureUrl } from './support';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };
afterEach((): void => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
});

const configure = (badClient = false, bootstrapExists = false): string[] => {
    process.env.KEYCLOAK_BASE_URL = 'https://admin.example.test';
    process.env.KEYCLOAK_CLIENT_ID = 'test-client';
    process.env.KEYCLOAK_CLIENT_SECRET = 'test-only-secret';
    process.env.KEYCLOAK_REALMS = 'learncard';
    const paths: string[] = [];
    const responder = async (
        input: string | URL | Request,
        options?: RequestInit
    ): Promise<Response> => {
        const url = new URL(input instanceof Request ? input.url : input);
        paths.push(url.pathname + url.search);
        expect(options?.redirect).toBe('error');
        if (url.pathname.endsWith('/token')) {
            expect(String(options?.body)).toContain('grant_type=client_credentials');
            return Response.json({ access_token: 'mock-token' });
        }
        if (url.pathname.endsWith('/users')) {
            expect(url.searchParams.get('exact')).toBe('true');
            return Response.json(bootstrapExists ? [{ username: 'admin' }] : []);
        }
        if (url.pathname.endsWith('/events/config'))
            return Response.json({
                eventsEnabled: true,
                adminEventsEnabled: true,
                eventsListeners: ['jboss-logging'],
            });
        if (url.pathname.endsWith('/clients')) {
            const first = Number(url.searchParams.get('first'));
            return Response.json(
                first === 0
                    ? Array.from({ length: 100 }, (_, index) => ({
                          id: String(index),
                          clientId: index === 0 ? 'learncard-app' : `test-${index}`,
                      }))
                    : []
            );
        }
        if (/\/clients\/\d+$/.test(url.pathname))
            return Response.json({
                directAccessGrantsEnabled: badClient,
                attributes: { 'pkce.code.challenge.method': 'S256' },
            });
        if (url.pathname.endsWith('/learncard'))
            return Response.json({ bruteForceProtected: true });
        throw new Error('Unexpected mocked request');
    };
    globalThis.fetch = Object.assign(mock(responder), { preconnect: originalFetch.preconnect });
    return paths;
};

test('A10 uses service credentials, exact user lookup and paginates clients', async (): Promise<void> => {
    const paths = configure();
    await checkProduction();
    expect(paths).toContain('/admin/realms/learncard/clients?first=100&max=100');
});

test('A10 fails closed on direct grants and bootstrap administrator', async (): Promise<void> => {
    configure(true, true);
    await expect(checkProduction()).rejects.toThrow('security assertions failed');
});

test('configuration guards refuse production sign-in before any request', async (): Promise<void> => {
    process.env.ENV = 'production';
    const fetchMock = mock(async (): Promise<Response> => {
        throw new Error('Network must not run');
    });
    globalThis.fetch = Object.assign(fetchMock, { preconnect: originalFetch.preconnect });
    await expect(signIn()).rejects.toThrow('staging-only');
    expect(fetchMock).not.toHaveBeenCalled();
});

test('HTTPS origins and JSON object validation reject unsafe inputs', (): void => {
    expect(secureUrl('https://admin.example.test')).toBe('https://admin.example.test');
    for (const value of [
        'http://admin.example.test',
        'https://a:b@admin.example.test',
        'https://admin.example.test/path',
        'https://admin.example.test/?token=x',
    ]) {
        expect(() => secureUrl(value)).toThrow();
    }
    for (const value of [null, [], false, 'object']) expect(() => record(value)).toThrow();
});
