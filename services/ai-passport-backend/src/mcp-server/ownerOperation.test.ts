import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';

const prefix = `mcp-owner-test:${randomUUID()}:`;
const redis = new Redis({
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6384),
    keyPrefix: prefix,
});
afterAll(async () => {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) await redis.del(...keys.map(key => key.slice(prefix.length)));
    await redis.quit();
});

mock.module('../constants/env', () => ({ REDIS_PREFIX: 'test' }));
mock.module('../ai/privacy-keys', () => ({
    getPrivacySubjectRef: (did: string) => `subject:${did}`,
    getPrivacyKeyMaterial: () => ({ erasureRequest: Buffer.alloc(32, 9) }),
}));
mock.module('../utils/cache', () => ({ default: { redis } }));

const { runMcpOwnerOperation } = await import('./ownerOperation');
const { getActiveOwnerOperationCount, requestDataErasure } =
    await import('../services/dataErasure');

describe('MCP owner operation coordination', () => {
    beforeEach(async () => {
        const keys = await redis.keys(`${prefix}*`);
        if (keys.length) await redis.del(...keys.map(key => key.slice(prefix.length)));
    });

    test('keeps deletion gated until an in-flight MCP write finishes', async () => {
        let markWriteStarted: (() => void) | undefined;
        let finishWrite: (() => void) | undefined;
        const writeStarted = new Promise<void>(resolve => {
            markWriteStarted = resolve;
        });
        const writeGate = new Promise<void>(resolve => {
            finishWrite = resolve;
        });
        const saving = runMcpOwnerOperation('did:example:alice', async () => {
            markWriteStarted?.();
            await writeGate;

            return 'saved';
        });

        await writeStarted;

        expect(await getActiveOwnerOperationCount('did:example:alice')).toBe(1);

        await requestDataErasure('did:example:alice');

        await expect(
            runMcpOwnerOperation('did:example:alice', async () => 'too late')
        ).rejects.toMatchObject({ code: 'data_erasure_requested' });
        expect(await getActiveOwnerOperationCount('did:example:alice')).toBe(1);

        finishWrite?.();

        await expect(saving).rejects.toMatchObject({
            code: 'data_erasure_requested',
        });
        expect(await getActiveOwnerOperationCount('did:example:alice')).toBe(0);
    });
});
