import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    canonicalizeJson,
    computeCleanupBackoffMs,
    computeLeaseExpiry,
    computeShareLinkRequestHash,
    getShareLinkRequestHashSecret,
    isLeaseActive,
} from '@helpers/share-link-lifecycle';

const mocks = vi.hoisted(() => ({
    run: vi.fn(),
}));

vi.mock('@instance', () => ({
    neogma: {
        queryRunner: {
            run: mocks.run,
        },
    },
}));

beforeEach(() => {
    vi.resetModules();
    mocks.run.mockReset();
});

describe('share-link canonical request hash', () => {
    it('is stable across object key insertion order', () => {
        const first = computeShareLinkRequestHash('update', {
            id: 'share-id',
            envelope: { iv: 'nonce', ct: 'ciphertext' },
            ownerEncryptedRecovery: { protected: 'header', ciphertext: 'recovery' },
        });
        const second = computeShareLinkRequestHash('update', {
            ownerEncryptedRecovery: { ciphertext: 'recovery', protected: 'header' },
            envelope: { ct: 'ciphertext', iv: 'nonce' },
            id: 'share-id',
        });

        expect(first).toBe(second);
    });

    it('covers the encrypted owner recovery', () => {
        const first = computeShareLinkRequestHash('create', {
            id: 'share-id',
            ownerEncryptedRecovery: { ciphertext: 'recovery-a' },
        });
        const second = computeShareLinkRequestHash('create', {
            id: 'share-id',
            ownerEncryptedRecovery: { ciphertext: 'recovery-b' },
        });

        expect(first).not.toBe(second);
    });

    it('binds the operation kind', () => {
        const payload = { id: 'share-id', title: 'Shared' };

        expect(computeShareLinkRequestHash('create', payload)).not.toBe(
            computeShareLinkRequestHash('update', payload)
        );
    });

    it('excludes the client request id that forms the operation key', () => {
        const first = computeShareLinkRequestHash('create', {
            id: 'share-id',
            clientRequestId: '11111111-1111-4111-8111-111111111111',
        });
        const second = computeShareLinkRequestHash('create', {
            id: 'share-id',
            clientRequestId: '22222222-2222-4222-8222-222222222222',
        });

        expect(first).toBe(second);
    });

    it('binds different passcodes while making the stored fingerprint secret-keyed', () => {
        const request = { id: 'share-id', title: 'Shared', passcode: '1234' };
        const first = computeShareLinkRequestHash('create', request);
        expect(computeShareLinkRequestHash('create', request)).toBe(first);
        expect(computeShareLinkRequestHash('create', { ...request, passcode: '1235' })).not.toBe(
            first
        );
        expect(first).not.toBe(
            createHash('sha256')
                .update(canonicalizeJson({ opKind: 'create', request }))
                .digest('hex')
        );
    });

    it('keeps the existing fingerprint for unprotected in-flight retries', () => {
        const request = { id: 'share-id', title: 'Shared' };
        expect(computeShareLinkRequestHash('create', request)).toBe(
            createHash('sha256')
                .update(canonicalizeJson({ opKind: 'create', request }))
                .digest('hex')
        );
    });

    it('requires an independently provisioned secret outside tests', () => {
        vi.stubEnv('NODE_ENV', 'production');
        vi.stubEnv('SHARE_LINK_REQUEST_HASH_SECRET', '');
        try {
            expect(getShareLinkRequestHashSecret).toThrow('SHARE_LINK_REQUEST_HASH_SECRET');
            vi.stubEnv('SHARE_LINK_REQUEST_HASH_SECRET', 'x'.repeat(32));
            expect(getShareLinkRequestHashSecret()).toBe('x'.repeat(32));
        } finally {
            vi.unstubAllEnvs();
        }
    });

    it('rejects values that cannot be encoded unambiguously', () => {
        expect(() => canonicalizeJson({ bad: () => undefined })).toThrow();
        expect(() => canonicalizeJson({ bad: Number.NaN })).toThrow();
        expect(() => canonicalizeJson({ bad: new Date() })).toThrow();
        expect(() => canonicalizeJson({ bad: new Array(2) })).toThrow();
        const cyclic: Record<string, unknown> = {};
        cyclic.self = cyclic;
        expect(() => canonicalizeJson(cyclic)).toThrow();
        expect(() => canonicalizeJson({ bad: 0.5 })).toThrow();
        expect(canonicalizeJson({ keep: 1, drop: undefined })).toBe('{"keep":1}');
    });
});

describe('share-link lease and backoff helpers', () => {
    it('treats a lease as inactive at the exact expiry instant', () => {
        const now = new Date('2026-01-01T00:00:00.000Z');
        const expiry = computeLeaseExpiry(now, 1000);

        expect(expiry).toBe('2026-01-01T00:00:01.000Z');
        expect(isLeaseActive(expiry, new Date('2026-01-01T00:00:00.999Z'))).toBe(true);
        expect(isLeaseActive(expiry, new Date('2026-01-01T00:00:01.000Z'))).toBe(false);
        expect(isLeaseActive(null, now)).toBe(false);
        expect(isLeaseActive('not-a-date', now)).toBe(false);
    });

    it('backs off exponentially and caps at one day', () => {
        expect(computeCleanupBackoffMs(0)).toBe(30_000);
        expect(computeCleanupBackoffMs(1)).toBe(60_000);
        expect(computeCleanupBackoffMs(-5)).toBe(30_000);
        expect(computeCleanupBackoffMs(100)).toBe(24 * 60 * 60 * 1000);
    });
});

describe('share-link constraint readiness', () => {
    it('creates every constraint and index once across concurrent callers', async () => {
        let releaseFirst!: () => void;
        const gate = new Promise<void>(resolve => {
            releaseFirst = resolve;
        });

        mocks.run.mockReturnValueOnce(gate).mockResolvedValue(undefined);

        const { ensureShareLinkConstraints, SHARE_LINK_SCHEMA_QUERIES } =
            await import('../src/models/share-link-constraints');

        const first = ensureShareLinkConstraints();
        const second = ensureShareLinkConstraints();

        expect(second).toBe(first);
        expect(mocks.run).toHaveBeenCalledTimes(1);

        releaseFirst();
        await Promise.all([first, second]);

        expect(mocks.run).toHaveBeenCalledTimes(SHARE_LINK_SCHEMA_QUERIES.length);
        expect(mocks.run.mock.calls.map(([query]) => query)).toEqual([
            ...SHARE_LINK_SCHEMA_QUERIES,
        ]);

        const queries = mocks.run.mock.calls.map(([query]) => String(query));
        expect(queries.some(query => query.includes('share_link_operation_key_unique'))).toBe(true);
        expect(queries.some(query => query.includes('share_link_reservation_share_unique'))).toBe(
            true
        );
        expect(queries.some(query => query.includes('share_content_cleanup_object_unique'))).toBe(
            true
        );
    });

    it('accepts an equivalent-schema-rule race as ready', async () => {
        mocks.run
            .mockRejectedValueOnce({
                code: 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists',
            })
            .mockResolvedValue(undefined);

        const { ensureShareLinkConstraints } = await import('../src/models/share-link-constraints');

        await expect(ensureShareLinkConstraints()).resolves.toBeUndefined();
    });

    it('clears failed readiness so a later request can retry', async () => {
        const failure = new Error('neo4j unavailable');
        mocks.run.mockRejectedValueOnce(failure).mockResolvedValue(undefined);

        const { ensureShareLinkConstraints } = await import('../src/models/share-link-constraints');

        await expect(ensureShareLinkConstraints()).rejects.toBe(failure);
        await expect(ensureShareLinkConstraints()).resolves.toBeUndefined();
    });
});
