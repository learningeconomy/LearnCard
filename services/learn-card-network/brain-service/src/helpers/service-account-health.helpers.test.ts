import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetch as probeFetch, Response } from 'undici/index.js';
vi.mock('undici/index.js', async importOriginal => {
    const original = await importOriginal<typeof import('undici/index.js')>();
    return { ...original, fetch: vi.fn() };
});
import {
    integrationConfigValid,
    integrationHealthUrlAllowed,
    probeIntegrationHealth,
} from './service-account-health.helpers';
import { signServiceAccountProbe, verifyServiceAccountToken } from './service-account-auth.helpers';
const account = {
    id: 'sa',
    installId: 'install',
    ecosystemId: 'eco',
    credentialGeneration: 1,
    status: 'PROVISIONED' as const,
    createdAt: new Date().toISOString(),
};
afterEach(() => vi.unstubAllGlobals());
describe('authenticated health helper', () => {
    it('validates config and treats absent configSchema as valid', () => {
        expect(integrationConfigValid(undefined, {})).toBe(true);
        const schema = {
            type: 'object',
            required: ['url'],
            properties: { url: { type: 'string' } },
            additionalProperties: false,
        };
        expect(integrationConfigValid(schema, {})).toBe(false);
        expect(integrationConfigValid(schema, { url: 'test' })).toBe(true);
        expect(integrationConfigValid(schema, { url: 5 })).toBe(false);
        expect(integrationConfigValid({ type: 'object', required: ['apiKey'] }, {})).toBe(false);
        expect(
            integrationConfigValid(
                { type: 'object', required: ['apiKey'], properties: { other: { type: 'string' } } },
                {}
            )
        ).toBe(false);
        expect(integrationConfigValid({ type: 'object', unknownConstraint: true }, {})).toBe(false);
    });
    it('rejects insecure or malformed endpoints, credentials and fragments', () => {
        for (const value of [
            'http://example.com',
            'ftp://example.com',
            'https://user:pass@example.com',
            'https://example.com/#token',
            'bad',
        ])
            expect(integrationHealthUrlAllowed(value)).toBe(false);
        expect(integrationHealthUrlAllowed('https://example.com/health')).toBe(true);
        expect(integrationHealthUrlAllowed('http://localhost:1234')).toBe(true);
    });
    it('requires challenge response, refuses redirects and bounds time', async () => {
        const fetchMock = vi
            .mocked(probeFetch)
            .mockResolvedValue(new Response(null, { status: 200 }));
        expect(await probeIntegrationHealth(account, 'https://example.com/health')).toBe(false);
        expect(fetchMock).toHaveBeenCalledWith(
            'https://example.com/health',
            expect.objectContaining({
                redirect: 'error',
                signal: expect.any(AbortSignal),
                headers: { 'x-educationos-health-challenge': expect.any(String) },
            })
        );
        fetchMock.mockRejectedValue(new Error('timeout or redirect'));
        expect(await probeIntegrationHealth(account, 'https://example.com/health')).toBe(false);
    });
    it('never accepts a signed health challenge as an API bearer token', async () => {
        const challenge = await signServiceAccountProbe(
            account,
            'https://example.com/health',
            'nonce'
        );
        await expect(verifyServiceAccountToken(challenge)).rejects.toThrow();
    });
});
