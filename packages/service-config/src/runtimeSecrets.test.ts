import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { send, destroy } = vi.hoisted(() => ({ send: vi.fn(), destroy: vi.fn() }));
vi.mock('@aws-sdk/client-secrets-manager', () => ({
    SecretsManagerClient: class {
        send = send;
        destroy = destroy;
    },
    GetSecretValueCommand: class {
        constructor(public input: { SecretId: string }) {}
    },
}));

beforeEach(() => {
    vi.resetModules();
    send.mockReset();
    destroy.mockReset();
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'lca-api-dev-api');
    vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
    vi.stubEnv('RUNTIME_TEST_VALUE', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('runtime secrets', () => {
    it.each([undefined, ''])('does nothing when id is %s', async id => {
        vi.stubEnv('RUNTIME_SECRETS_ID', id);
        const { loadRuntimeSecrets } = await import('./runtimeSecrets');
        await loadRuntimeSecrets();
        expect(send).not.toHaveBeenCalled();
    });

    it('does nothing outside AWS Lambda even with an id present', async () => {
        vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', undefined);
        send.mockResolvedValue({ SecretString: '{"RUNTIME_TEST_VALUE":"secret"}' });
        const { loadRuntimeSecrets } = await import('./runtimeSecrets');
        await loadRuntimeSecrets();
        expect(send).not.toHaveBeenCalled();
        expect(process.env.RUNTIME_TEST_VALUE).toBe('');
    });

    it('fetches once for concurrent and subsequent calls and merges before resolving', async () => {
        send.mockResolvedValue({ SecretString: '{"RUNTIME_TEST_VALUE":"secret"}' });
        const { loadRuntimeSecrets } = await import('./runtimeSecrets');
        await Promise.all([loadRuntimeSecrets(), loadRuntimeSecrets()]);
        await loadRuntimeSecrets();
        expect(process.env.RUNTIME_TEST_VALUE).toBe('secret');
        expect(send).toHaveBeenCalledTimes(1);
        expect(send.mock.calls[0]?.[0].input).toEqual({ SecretId: 'lca-api/dev/runtime-secrets' });
        expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('reads the bundle id from a custom secretIdEnv', async () => {
        vi.stubEnv('RUNTIME_SECRETS_ID', '');
        vi.stubEnv('CUSTOM_SECRETS_ID', 'brain/dev/runtime-secrets');
        send.mockResolvedValue({ SecretString: '{"RUNTIME_TEST_VALUE":"custom"}' });
        const { loadRuntimeSecrets } = await import('./runtimeSecrets');
        await loadRuntimeSecrets({ secretIdEnv: 'CUSTOM_SECRETS_ID' });
        expect(process.env.RUNTIME_TEST_VALUE).toBe('custom');
        expect(send.mock.calls[0]?.[0].input).toEqual({ SecretId: 'brain/dev/runtime-secrets' });
    });

    it('memoizes per secret id so distinct ids each fetch once', async () => {
        send.mockResolvedValueOnce({ SecretString: '{"RUNTIME_TEST_VALUE":"first"}' });
        send.mockResolvedValueOnce({ SecretString: '{"OTHER_VALUE":"second"}' });
        vi.stubEnv('OTHER_VALUE', '');
        const { loadRuntimeSecrets } = await import('./runtimeSecrets');
        await loadRuntimeSecrets();
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/prod/runtime-secrets');
        await loadRuntimeSecrets();
        await loadRuntimeSecrets();
        expect(process.env.RUNTIME_TEST_VALUE).toBe('first');
        expect(process.env.OTHER_VALUE).toBe('second');
        expect(send).toHaveBeenCalledTimes(2);
    });

    it('preserves nonempty overrides, replaces empty values, and keeps the merge pure', async () => {
        const { mergeRuntimeSecrets } = await import('./runtimeSecrets');
        const current = { KEEP: 'override', EMPTY: '', UNRELATED: 'untouched' };
        expect(
            mergeRuntimeSecrets(current, { KEEP: 'secret', EMPTY: 'filled', NEW: 'new' })
        ).toEqual({
            KEEP: 'override',
            EMPTY: 'filled',
            NEW: 'new',
            UNRELATED: 'untouched',
        });
        expect(current.EMPTY).toBe('');
        vi.stubEnv('RUNTIME_TEST_VALUE', 'override');
        send.mockResolvedValue({ SecretString: '{"RUNTIME_TEST_VALUE":"secret"}' });
        const { loadRuntimeSecrets } = await import('./runtimeSecrets');
        await loadRuntimeSecrets();
        expect(process.env.RUNTIME_TEST_VALUE).toBe('override');
    });

    it.each([
        undefined,
        '',
        'sensitive-invalid-json',
        'null',
        '[]',
        '"sensitive-string"',
        '42',
        'true',
        '{"sensitive-key":"sensitive-value"}',
        '{"1KEY":"sensitive-value"}',
        '{"__proto__":"sensitive-value"}',
        '{"BAD__KEY":"sensitive-value"}',
        '{"KEY":123}',
        '{"KEY":null}',
        '{"KEY":false}',
        '{"KEY":[]}',
        '{"KEY":{}}',
    ])('rejects malformed bundles without leaking content (%#)', async serialized => {
        const { parseRuntimeSecrets, loadRuntimeSecrets } = await import('./runtimeSecrets');
        expect(() => parseRuntimeSecrets(serialized)).toThrow('Invalid runtime secrets bundle');
        send.mockResolvedValue({ SecretString: serialized });
        await expect(loadRuntimeSecrets()).rejects.toThrow(
            /^Unable to load runtime secrets bundle$/
        );
        expect(process.env.RUNTIME_TEST_VALUE).toBe('');
    });

    it('validates all entries before modifying env and retries a failed cold start', async () => {
        send.mockResolvedValueOnce({
            SecretString: '{"RUNTIME_TEST_VALUE":"partial-secret","BAD":1}',
        });
        send.mockResolvedValueOnce({ SecretString: '{"RUNTIME_TEST_VALUE":"recovered"}' });
        const { loadRuntimeSecrets } = await import('./runtimeSecrets');
        await expect(loadRuntimeSecrets()).rejects.toThrow('Unable to load runtime secrets bundle');
        expect(process.env.RUNTIME_TEST_VALUE).toBe('');
        await loadRuntimeSecrets();
        expect(process.env.RUNTIME_TEST_VALUE).toBe('recovered');
        expect(send).toHaveBeenCalledTimes(2);
    });

    it('sanitizes SDK errors including their causes and retries', async () => {
        send.mockRejectedValueOnce(new Error('sensitive-value', { cause: 'sensitive-cause' }));
        send.mockResolvedValueOnce({ SecretString: '{}' });
        const { loadRuntimeSecrets } = await import('./runtimeSecrets');
        const error = await loadRuntimeSecrets().catch((error: Error) => error);
        expect(error).toBeInstanceOf(Error);
        expect(String(error)).toBe('Error: Unable to load runtime secrets bundle');
        expect(error).not.toHaveProperty('cause');
        await loadRuntimeSecrets();
        expect(send).toHaveBeenCalledTimes(2);
    });

    it('accepts empty objects and string values including empty strings', async () => {
        const { parseRuntimeSecrets } = await import('./runtimeSecrets');
        expect(parseRuntimeSecrets('{}')).toEqual({});
        expect(parseRuntimeSecrets('{"KEY_2":""}')).toEqual({ KEY_2: '' });
    });
});
