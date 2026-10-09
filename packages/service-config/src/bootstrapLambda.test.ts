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

const importBootstrap = async () => (await import('./bootstrapLambda')).bootstrapLambda;

beforeEach(() => {
    vi.resetModules();
    send.mockReset();
    destroy.mockReset();
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'lca-api-dev-api');
    vi.stubEnv('RUNTIME_SECRETS_ID', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('bootstrapLambda', () => {
    it('imports the app only after secrets resolve and shares one bootstrap across calls', async () => {
        const bootstrapLambda = await importBootstrap();
        let release: () => void = () => {};
        send.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve({ SecretString: '{}' });
            })
        );
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        const importApp = vi.fn().mockResolvedValue({ ok: true });
        const getApp = bootstrapLambda({ importApp });
        const first = getApp();
        const second = getApp();
        expect(importApp).not.toHaveBeenCalled();
        release();
        await expect(Promise.all([first, second])).resolves.toEqual([{ ok: true }, { ok: true }]);
        expect(importApp).toHaveBeenCalledTimes(1);
    });

    it('fetches secrets once across many concurrent cold-start callers', async () => {
        const bootstrapLambda = await importBootstrap();
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        vi.stubEnv('FROM_STAGE', '');
        let release: () => void = () => {};
        send.mockReturnValue(
            new Promise(resolve => {
                release = () => resolve({ SecretString: '{"FROM_BUNDLE":"bundle"}' });
            })
        );
        const importApp = vi.fn().mockResolvedValue({ ok: true });
        const getApp = bootstrapLambda({
            stages: { dev: { FROM_STAGE: 'stage' } },
            stage: 'dev',
            importApp,
        });
        const calls = Array.from({ length: 5 }, () => getApp());
        release();
        await Promise.all(calls);
        expect(send).toHaveBeenCalledTimes(1);
        expect(importApp).toHaveBeenCalledTimes(1);
        expect(process.env.FROM_BUNDLE).toBe('bundle');
        expect(process.env.FROM_STAGE).toBe('stage');
    });

    it('caches the imported app even when its evaluation fails, since the bundler cannot retry', async () => {
        const bootstrapLambda = await importBootstrap();
        const failure = new Error('invalid config');
        const importApp = vi.fn().mockRejectedValue(failure);
        const getApp = bootstrapLambda({ importApp });
        await expect(getApp()).rejects.toThrow('invalid config');
        await expect(getApp()).rejects.toThrow('invalid config');
        expect(importApp).toHaveBeenCalledTimes(1);
    });

    it('caches a synchronously thrown import failure without re-importing', async () => {
        const bootstrapLambda = await importBootstrap();
        const importApp = vi.fn(() => {
            throw new Error('sync import boom');
        });
        const getApp = bootstrapLambda({ importApp });
        await expect(getApp()).rejects.toThrow('sync import boom');
        await expect(getApp()).rejects.toThrow('sync import boom');
        expect(importApp).toHaveBeenCalledTimes(1);
    });

    it('retries secrets loading on failure without importing the app', async () => {
        const bootstrapLambda = await importBootstrap();
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        send.mockRejectedValueOnce(new Error('aws down'));
        send.mockResolvedValueOnce({ SecretString: '{}' });
        const importApp = vi.fn().mockResolvedValue({ ok: true });
        const getApp = bootstrapLambda({ importApp });
        await expect(getApp()).rejects.toThrow('Unable to load runtime secrets bundle');
        expect(importApp).not.toHaveBeenCalled();
        await expect(getApp()).resolves.toEqual({ ok: true });
        expect(send).toHaveBeenCalledTimes(2);
        expect(importApp).toHaveBeenCalledTimes(1);
    });

    it('re-applies stage defaults after a secrets failure retry', async () => {
        const bootstrapLambda = await importBootstrap();
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        vi.stubEnv('FROM_STAGE', '');
        send.mockRejectedValueOnce(new Error('aws down'));
        send.mockResolvedValueOnce({ SecretString: '{"FROM_BUNDLE":"bundle"}' });
        const importApp = vi.fn().mockResolvedValue({ ok: true });
        const getApp = bootstrapLambda({
            stages: { dev: { FROM_STAGE: 'stage' } },
            stage: 'dev',
            importApp,
        });
        await expect(getApp()).rejects.toThrow('Unable to load runtime secrets bundle');
        await getApp();
        expect(process.env.FROM_STAGE).toBe('stage');
        expect(process.env.FROM_BUNDLE).toBe('bundle');
    });

    it('fills stage defaults into process.env before importing', async () => {
        const bootstrapLambda = await importBootstrap();
        vi.stubEnv('REGION', '');
        vi.stubEnv('LOG_LEVEL', '');
        const importApp = vi.fn().mockResolvedValue({ ok: true });
        const getApp = bootstrapLambda({
            base: { REGION: 'us-east-1' },
            stages: { dev: { LOG_LEVEL: 'debug' } },
            stage: 'dev',
            importApp,
        });
        await getApp();
        expect(process.env.REGION).toBe('us-east-1');
        expect(process.env.LOG_LEVEL).toBe('debug');
    });

    it('retains the base value when a stage value is empty (empty means unset)', async () => {
        const bootstrapLambda = await importBootstrap();
        vi.stubEnv('SHARED', '');
        const importApp = vi.fn().mockResolvedValue({ ok: true });
        const getApp = bootstrapLambda({
            base: { SHARED: 'from-base' },
            stages: { dev: { SHARED: '' } },
            stage: 'dev',
            importApp,
        });
        await getApp();
        expect(process.env.SHARED).toBe('from-base');
    });

    it('preserves explicit real env over bundle and stage (real env > bundle > stage > base)', async () => {
        const bootstrapLambda = await importBootstrap();
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        vi.stubEnv('EXPLICIT', 'real');
        vi.stubEnv('ALSO_STAGE', '');
        vi.stubEnv('FROM_STAGE', '');
        vi.stubEnv('FROM_BASE', '');
        send.mockResolvedValue({
            SecretString: '{"FROM_BUNDLE":"bundle","ALSO_STAGE":"bundle-wins"}',
        });
        const importApp = vi.fn().mockResolvedValue({ ok: true });
        const getApp = bootstrapLambda({
            base: { EXPLICIT: 'base', FROM_BASE: 'base' },
            stages: { dev: { EXPLICIT: 'stage', ALSO_STAGE: 'stage', FROM_STAGE: 'stage' } },
            stage: 'dev',
            importApp,
        });
        await getApp();
        expect(process.env.EXPLICIT).toBe('real');
        expect(process.env.ALSO_STAGE).toBe('bundle-wins');
        expect(process.env.FROM_STAGE).toBe('stage');
        expect(process.env.FROM_BASE).toBe('base');
    });

    it('lets the bundle override a stage-added value while keeping other stage defaults', async () => {
        const bootstrapLambda = await importBootstrap();
        vi.stubEnv('RUNTIME_SECRETS_ID', 'lca-api/dev/runtime-secrets');
        vi.stubEnv('OVERRIDE_ME', '');
        vi.stubEnv('KEEP_ME', '');
        send.mockResolvedValue({ SecretString: '{"OVERRIDE_ME":"from-bundle"}' });
        const importApp = vi.fn().mockResolvedValue({ ok: true });
        const getApp = bootstrapLambda({
            stages: { dev: { OVERRIDE_ME: 'from-stage', KEEP_ME: 'from-stage' } },
            stage: 'dev',
            importApp,
        });
        await getApp();
        expect(process.env.OVERRIDE_ME).toBe('from-bundle');
        expect(process.env.KEEP_ME).toBe('from-stage');
    });
});
