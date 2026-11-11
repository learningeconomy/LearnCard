import { afterEach, describe, expect, it, vi } from 'vitest';
import cache from '@cache';
import { consumeMatchingCode } from './getDel';

vi.mock('@cache', async () => {
    const { default: Redis } = await import('ioredis-mock');
    return { default: { node: new Redis() } };
});

afterEach(async () => {
    await cache.node.flushall();
});

describe('consumeMatchingCode', () => {
    it('preserves a valid code after a wrong guess', async () => {
        await cache.node.set('login-code:test@example.com', '123456');
        expect(await consumeMatchingCode('login-code:test@example.com', '000000')).toBe(false);
        expect(await cache.node.get('login-code:test@example.com')).toBe('123456');
    });

    it('allows exactly one concurrent redemption and rejects replay', async () => {
        await cache.node.set('login-code:test@example.com', '123456');
        const results = await Promise.all([
            consumeMatchingCode('login-code:test@example.com', '123456'),
            consumeMatchingCode('login-code:test@example.com', '123456'),
        ]);
        expect(results.filter(Boolean)).toHaveLength(1);
        expect(await consumeMatchingCode('login-code:test@example.com', '123456')).toBe(false);
    });

    it('rejects missing codes', async () => {
        expect(await consumeMatchingCode('login-code:missing@example.com', '123456')).toBe(false);
    });
});
