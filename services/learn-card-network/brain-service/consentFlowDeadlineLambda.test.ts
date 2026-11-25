import type { Context } from 'aws-lambda';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import baseConfig from './config/config.json';
import devConfig from './config/config.dev.json';

const { send, deadlineAppImport, databaseRun, loadedEnvironment } = vi.hoisted(() => ({
    send: vi.fn(),
    deadlineAppImport: vi.fn(),
    databaseRun: vi.fn(),
    loadedEnvironment: vi.fn(),
}));

vi.mock('@aws-sdk/client-secrets-manager', () => ({
    SecretsManagerClient: class {
        send = send;
        destroy = vi.fn();
    },
    GetSecretValueCommand: class {
        constructor(public input: { SecretId: string }) {}
    },
}));
// Static imports would validate configuration before the cold-start secrets boundary.
vi.mock('./consentFlowDeadlineLambdaApp', async importOriginal => {
    deadlineAppImport();
    return importOriginal();
});
vi.mock('./src/instance', async () => {
    // Keep real import-time validation; replace only the database transport.
    const { environment } = await import('./src/config/environment');
    loadedEnvironment(environment);
    return { neogma: { queryRunner: { run: databaseRun } } };
});

beforeEach(() => {
    vi.resetModules();
    send.mockReset();
    deadlineAppImport.mockReset();
    databaseRun.mockReset();
    loadedEnvironment.mockReset();
    for (const key of new Set([...Object.keys(baseConfig), ...Object.keys(devConfig)])) {
        vi.stubEnv(key, undefined);
    }
    vi.stubEnv('DOTENV_CONFIG_PATH', '/dev/null');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CONFIG_TENANT', '');
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'lcn-brain-service-dev-consentFlowDeadline');
    vi.stubEnv('LAMBDA_STAGE', 'dev');
    vi.stubEnv('RUNTIME_SECRETS_ID', 'brain-service/dev/runtime-secrets');
});
afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
});

it('does not import or run deadline work when runtime secrets fail to load', async () => {
    send.mockRejectedValue(new Error('secrets unavailable'));
    const { consentFlowDeadlineHandler } = await import('./consentFlowDeadlineLambda');

    await expect(
        consentFlowDeadlineHandler({}, { getRemainingTimeInMillis: () => 30_000 } as Context)
    ).rejects.toThrow('Unable to load runtime secrets bundle');
    expect(deadlineAppImport).not.toHaveBeenCalled();
});

it('boots from the secrets bundle and keeps warm deadline work independent of secrets availability', async () => {
    const secrets = {
        SEED: 'a'.repeat(64),
        NEO4J_URI: 'bolt://deadline-test:7687',
        NEO4J_USERNAME: 'deadline-test',
        NEO4J_PASSWORD: 'test-password',
        CREDENTIAL_REFRESH_DIGEST_SECRET: 'deadline-test-refresh-digest',
    };
    for (const key of Object.keys(secrets)) vi.stubEnv(key, undefined);
    send.mockImplementationOnce(async () => {
        for (const key of Object.keys(secrets)) expect(process.env[key]).toBeUndefined();
        expect(deadlineAppImport).not.toHaveBeenCalled();
        return { SecretString: JSON.stringify(secrets) };
    });
    send.mockRejectedValue(new Error('Secrets Manager unavailable after cold start'));
    // Two terms are suspended; the expiry scan finds its watermark and no candidates.
    databaseRun.mockImplementation(async (query: string) => {
        if (query.includes("SET terms.status = 'suspended'")) {
            return { records: [{ get: () => ({ toNumber: () => 2 }) }] };
        }
        if (query.includes('ConsentFlowJobState') && query.includes('RETURN')) {
            return { records: [{ get: () => '2026-01-01T23:59:00.000Z' }] };
        }
        return { records: [] };
    });
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'));

    const { consentFlowDeadlineHandler } = await import('./consentFlowDeadlineLambda');
    expect(deadlineAppImport).not.toHaveBeenCalled();

    // The forwarded context must prevent database writes after a slow cold start.
    await expect(
        consentFlowDeadlineHandler({}, { getRemainingTimeInMillis: () => 1_000 } as Context)
    ).resolves.toEqual({ suspended: 0, expired: 0, shareUntilPassed: 0 });
    expect(databaseRun).not.toHaveBeenCalled();
    expect(loadedEnvironment).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(secrets));

    // Scheduled input cannot replace the server's cutoff, and a warm call needs no new fetch.
    await expect(
        consentFlowDeadlineHandler({ now: '2099-01-01T00:00:00.000Z' }, {
            getRemainingTimeInMillis: () => 30_000,
        } as Context)
    ).resolves.toEqual({ suspended: 2, expired: 0, shareUntilPassed: 0 });
    const now = '2026-01-02T00:00:00.000Z';
    const callsMatching = (text: string): unknown[][] =>
        databaseRun.mock.calls.filter(([query]) => String(query).includes(text));

    expect(callsMatching("SET terms.status = 'suspended'")).toEqual([
        [expect.any(String), expect.objectContaining({ now })],
    ]);
    // The expiry scan reads both indexed ranges, 15 hours behind the stored watermark up to
    // the server's own clock, then advances the watermark.
    for (const label of ['ConsentFlowTerms', 'ConsentFlowContractVersion']) {
        expect(callsMatching(`USING INDEX node:${label}(expiresAt)`)).toEqual([
            [
                expect.any(String),
                expect.objectContaining({ from: '2026-01-01T08:59:00.000Z', now }),
            ],
        ]);
    }
    expect(callsMatching('WHERE state.through IS NULL OR state.through < $now')).toHaveLength(1);
    // The share-until scan reads only the indexed range, up to the server's own clock.
    expect(callsMatching('USING INDEX terms:ConsentFlowTerms(nextShareUntil)')).toEqual([
        [expect.any(String), expect.objectContaining({ now })],
    ]);
    // No statement may contain a line comment: the query runner collapses whitespace.
    for (const [query] of databaseRun.mock.calls) expect(String(query)).not.toContain('//');
    expect(send).toHaveBeenCalledOnce();
    expect(deadlineAppImport).toHaveBeenCalledOnce();
});
