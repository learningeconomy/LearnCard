import { describe, expect, it, vi } from 'vitest';
import {
    SecretsManagerClient,
    GetSecretValueCommand,
    PutSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { refreshIdentity, RunnerAuthError, RunnerExchangeError } from './auth';
import { createSecretStore } from './secrets';
import { createMetrics } from './metrics';
import { memoryStorage } from './storage';

describe('runner boundaries', () => {
    it('exchanges refresh tokens using form encoding and captures rotation', async () => {
        const transport = vi.fn<typeof fetch>(async () =>
            Response.json({ id_token: 'new-id', refresh_token: 'new-refresh' })
        );
        expect(await refreshIdentity('api-key', 'old+refresh', transport)).toEqual({
            token: 'new-id',
            refreshToken: 'new-refresh',
        });
        const request = transport.mock.calls[0];
        expect(request[0]).toBe('https://securetoken.googleapis.com/v1/token?key=api-key');
        expect(String(request[1]?.body)).toBe(
            'grant_type=refresh_token&refresh_token=old%2Brefresh'
        );
    });
    it('auth errors discard Google response bodies', async () => {
        await expect(
            refreshIdentity(
                'key',
                'refresh',
                vi.fn<typeof fetch>(async () => new Response('private token', { status: 400 }))
            )
        ).rejects.toEqual(new RunnerAuthError());
    });
    it.each([429, 500, 503])('does not classify HTTP %s as a credential failure', async status => {
        await expect(
            refreshIdentity('key', 'refresh', async () => new Response('private', { status }))
        ).rejects.toEqual(new RunnerExchangeError('unavailable'));
    });
    it.each(['network', 'timeout', 'json', 'schema'])(
        'keeps %s errors separate from auth and scrubs payloads',
        async kind => {
            const transport = vi.fn<typeof fetch>(async () => {
                if (kind === 'network' || kind === 'timeout') throw new Error('private token');
                return kind === 'json'
                    ? new Response('private malformed json')
                    : Response.json({ private: 'token' });
            });
            await expect(refreshIdentity('key', 'refresh', transport)).rejects.toEqual(
                new RunnerExchangeError(
                    kind === 'network' || kind === 'timeout' ? 'transport' : 'invalid_response'
                )
            );
        }
    );
    it('uses scoped Secrets Manager commands and validates before use', async () => {
        const client = new SecretsManagerClient({ region: 'us-east-1' });
        const response = {
            SecretString: JSON.stringify({
                accountId: 'test',
                privateKey: 'a'.repeat(64),
                did: 'did:key:test',
                pin: '738195',
                refreshToken: 'refresh',
                recoveryEmail: 'test@example.invalid',
                recoveryLanguage: 'en',
                deviceState: { shares: {}, versions: {} },
            }),
        };
        const send = vi.spyOn(client, 'send').mockImplementation(async () => response);
        const store = createSecretStore(client);
        const secret = await store.read('test-arn');
        secret.refreshToken = 'rotated';
        await store.write('test-arn', secret);
        expect(send.mock.calls[0][0]).toBeInstanceOf(GetSecretValueCommand);
        expect(send.mock.calls[1][0]).toBeInstanceOf(PutSecretValueCommand);
        expect(send.mock.calls[1][0].input).toMatchObject({
            SecretId: 'test-arn',
            SecretString: JSON.stringify(secret),
        });
    });
    it.each(['not json', '{}'])('rejects malformed secret %s before use', async SecretString => {
        const client = new SecretsManagerClient({ region: 'us-east-1' });
        vi.spyOn(client, 'send').mockImplementation(async () => ({ SecretString }));
        await expect(createSecretStore(client).read('test-arn')).rejects.toThrow();
    });
    it('scrubs all non-allowlisted values, including a forged reason', () => {
        const lines: string[] = [];
        createMetrics('staging', 2, line => lines.push(line))('Step.Failure', 1, 'recovery', {
            reason: 'secret-pin',
            seed: 'secret-seed',
            email: 'private@example.invalid',
            message: 'private token',
        });
        expect(lines.join()).not.toMatch(/secret|private/);
        expect(lines.join()).toContain('unexpected');
    });
    it('preserves SDK candidate IDs and makes snapshots independent', async () => {
        const memory = memoryStorage();
        await memory.storage.storeDeviceShare('candidate', 'pending');
        await memory.storage.storeShareVersion(5, 'pending');
        const snapshot = memory.snapshot();
        await memory.storage.deleteDeviceShare('pending');
        expect(snapshot.shares.pending).toBe('candidate');
        expect(await memory.storage.getDeviceShare('pending')).toBeNull();
        expect(await memory.storage.getShareVersion('pending')).toBeNull();
    });
});

describe('tier 3 metric rollups', () => {
    it('keeps Account and Kind diagnostic; alarms use {Environment, Tier}', () => {
        const lines: string[] = [];
        const emit = createMetrics('production', 3, line => lines.push(line));
        emit(
            'Tier3.Released',
            0,
            undefined,
            { reason: 'did_mismatch' },
            { holdAccount: 'hold-03', kind: 'daily' }
        );
        emit('Tier3.EmailLatency', 1234, undefined, undefined, {
            holdAccount: 'hold-03',
            kind: 'code',
        });
        const [released, latency] = lines.map(line => JSON.parse(line));
        expect(released._aws.CloudWatchMetrics[0].Dimensions).toEqual([
            ['Environment', 'Tier', 'Account', 'Kind', 'Reason'],
            ['Environment', 'Tier'],
        ]);
        expect(released).toMatchObject({ Tier: '3', Account: 'hold-03', Reason: 'did_mismatch' });
        expect(latency._aws.CloudWatchMetrics[0].Dimensions).toEqual([
            ['Environment', 'Tier', 'Account', 'Kind'],
            ['Environment', 'Tier', 'Kind'],
            ['Environment', 'Tier'],
        ]);
        expect(latency._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe('Milliseconds');
    });
});

describe('provisioning stays out of the Lambda', () => {
    it("handler.ts's import graph never reaches src/provision or test fakes", async () => {
        const { readFile } = await import('node:fs/promises');
        const { dirname, resolve } = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const root = dirname(fileURLToPath(import.meta.url));
        const seen = new Set<string>();
        const visit = async (file: string): Promise<void> => {
            if (seen.has(file)) return;
            seen.add(file);
            const source = await readFile(file, 'utf8');
            for (const match of source.matchAll(
                /from '(\.{1,2}\/[^']+)'|import\('(\.{1,2}\/[^']+)'\)/g
            ))
                await visit(`${resolve(dirname(file), match[1] ?? match[2])}.ts`);
        };
        await visit(resolve(root, 'handler.ts'));
        const files = [...seen].map(file => file.slice(root.length + 1));
        expect(files).toContain('tier3/inbox.ts');
        expect(
            files.filter(file => file.startsWith('provision/') || /test-|\.test\./.test(file))
        ).toEqual([]);
    });
});
