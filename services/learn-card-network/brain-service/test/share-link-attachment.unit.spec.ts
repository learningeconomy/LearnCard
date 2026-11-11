import { describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createShareLinkAttachmentOwnerApi } from '../src/helpers/share-link-attachment';
import { verifyShareAttachmentStats } from '../src/helpers/share-link-coordinator/attachment-stat';
import {
    mintShareAttachmentAccessToken,
    verifyShareAttachmentAccessToken,
} from '../src/helpers/share-link-attachment-access';
import { computeShareLinkRequestHash } from '../src/helpers/share-link-lifecycle';
import type { ShareLinkReservationRecord } from '../src/accesslayer/share-link/types';
import type { ShareLinkRecord } from '../src/models/ShareLink';
import type { ShareContentTuple } from '../src/helpers/share-content-client/types';
import { ShareLinkRepositoryError } from '../src/accesslayer/share-link/errors';

const shareId = Buffer.alloc(16, 7).toString('base64url');
const attachmentId = randomUUID();
const owner = { namespace: 'deployment', ownerProfileId: 'owner' };
const envelope = {
    v: 1 as const,
    alg: 'A256GCM' as const,
    iv: Buffer.alloc(12, 1).toString('base64url'),
    ct: Buffer.alloc(32, 2).toString('base64url'),
};
const input = {
    id: shareId,
    contentVersion: 1,
    attachmentId,
    chunkIndex: 0,
    chunkCount: 1,
    envelope,
    ownerEncryptedRecovery: { protected: 'p', iv: 'i', ciphertext: 'c', tag: 't' },
};
const summary = (tuple: ShareContentTuple) => ({
    kind: 'active' as const,
    ...tuple,
    contentHash: 'a'.repeat(64),
    payloadHash: 'b'.repeat(64),
    ciphertextBytes: 32,
    recoveryBytes: 4,
    createdAt: '2026-10-03T00:00:00Z',
});

describe('attachment owner transport and immutable commit binding', () => {
    it('retains incomplete stage after lost put acknowledgement and safely retries the same tuple', async () => {
        const repository = {
            begin: vi.fn(async () => undefined),
            complete: vi.fn(async () => undefined),
            deleteUnreferenced: vi.fn(async () => true),
        };
        const client = {
            put: vi.fn(async (value: ShareContentTuple) => ({
                ok: true as const,
                value: { status: 'idempotent' as const, record: summary(value) },
            })),
            delete: vi.fn(async (tuple: ShareContentTuple) => ({
                ok: true as const,
                value: {
                    kind: 'tombstone' as const,
                    ...tuple,
                    deletedAt: '2026-10-03T00:00:00Z',
                },
            })),
        };
        client.put.mockResolvedValueOnce({ ok: false, error: 'NETWORK_ERROR' } as never);
        const api = createShareLinkAttachmentOwnerApi(client, repository);
        await expect(api.put(input, owner)).rejects.toMatchObject({ code: 'UNAVAILABLE' });
        expect(repository.complete).not.toHaveBeenCalled();
        await expect(api.put(input, owner)).resolves.toEqual({ ok: true });
        expect(client.put).toHaveBeenCalledTimes(2);
        expect(client.put.mock.calls[0]![0]).toEqual(client.put.mock.calls[1]![0]);
        expect(repository.complete).toHaveBeenCalledOnce();
    });

    it('preserves definitive staging failures so callers can discard an expired attempt', async () => {
        const repository = {
            begin: vi
                .fn()
                .mockRejectedValue(
                    new ShareLinkRepositoryError('PRECONDITION_FAILED', 'private detail')
                ),
            complete: vi.fn(),
            deleteUnreferenced: vi.fn(),
        };
        const client = { put: vi.fn(), delete: vi.fn() };
        const api = createShareLinkAttachmentOwnerApi(client, repository);
        await expect(api.put(input, owner)).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
            message: 'attachment upload unavailable',
        });
        expect(client.put).not.toHaveBeenCalled();
    });

    it('never deletes a referenced/ambiguous stage and reports physical cleanup failure while durable jobs remain', async () => {
        const client = {
            put: vi.fn(),
            delete: vi.fn().mockResolvedValue({ ok: false, error: 'UNAVAILABLE' }),
        };
        const repository = {
            begin: vi.fn(),
            complete: vi.fn(),
            deleteUnreferenced: vi.fn(async () => false),
        };
        const api = createShareLinkAttachmentOwnerApi(client, repository);
        const key = { id: shareId, contentVersion: 1, attachmentId, chunkCount: 2 };
        await expect(api.delete(key, owner)).resolves.toEqual({ ok: false });
        expect(client.delete).not.toHaveBeenCalled();
        repository.deleteUnreferenced.mockResolvedValueOnce(true);
        await expect(api.delete(key, owner)).resolves.toEqual({ ok: false });
        expect(client.delete).toHaveBeenCalledTimes(2);
        expect(client.delete.mock.calls[1]![0]).toEqual({
            ...owner,
            shareId,
            contentVersion: 1,
            objectId: `resume-pdf-${attachmentId}-1`,
            operationId: attachmentId,
        });
    });

    it('requires all staged objects stat-present under exactly the committed owner/version/asset tuple', async () => {
        const reservation = {
            ...owner,
            shareId,
            contentVersion: 1,
            attachmentId,
            attachmentChunkCount: 2,
        } as ShareLinkReservationRecord;
        const client = {
            stat: vi.fn(async (tuple: ShareContentTuple) => ({
                ok: true as const,
                value: summary(tuple),
            })),
        };
        await expect(verifyShareAttachmentStats(client, reservation)).resolves.toBe(true);
        expect(client.stat).toHaveBeenCalledTimes(2);
        client.stat.mockResolvedValueOnce({ ok: false, error: 'NOT_FOUND' } as never);
        await expect(verifyShareAttachmentStats(client, reservation)).resolves.toBe(false);
        client.stat.mockImplementationOnce(async tuple => ({
            ok: true as const,
            value: summary({ ...tuple, ownerProfileId: 'foreign' }),
        }));
        await expect(verifyShareAttachmentStats(client, reservation)).resolves.toBe(false);
        await expect(
            verifyShareAttachmentStats(client, reservation, {
                exhausted: () => true,
                remainingMs: () => 0,
            })
        ).resolves.toBe(false);
    });

    it('binds attachment identity and count into client-request idempotency intent', () => {
        const base = { id: shareId, attachment: { id: attachmentId, chunkCount: 2 } };
        const hash = computeShareLinkRequestHash('create', base);
        expect(
            computeShareLinkRequestHash('create', {
                ...base,
                attachment: { id: randomUUID(), chunkCount: 2 },
            })
        ).not.toBe(hash);
        expect(
            computeShareLinkRequestHash('create', {
                ...base,
                attachment: { id: attachmentId, chunkCount: 1 },
            })
        ).not.toBe(hash);
    });

    it('reserves the bounded remote call and finalization time before each chunk stat', async () => {
        const reservation = {
            ...owner,
            shareId,
            contentVersion: 1,
            attachmentId,
            attachmentChunkCount: 2,
        } as ShareLinkReservationRecord;
        let remaining = 1600;
        const client = {
            stat: vi.fn(async (tuple: ShareContentTuple) => {
                remaining = 1499;
                return { ok: true as const, value: summary(tuple) };
            }),
        };
        const budget = {
            remainingMs: () => remaining,
            reserveMs: () => 500,
            exhausted: () => false,
        };
        await expect(verifyShareAttachmentStats(client, reservation, budget, 1000)).resolves.toBe(
            false
        );
        expect(client.stat).toHaveBeenCalledOnce();
    });
});

describe('short-lived attachment password grant', () => {
    const record = {
        id: shareId,
        ownerProfileId: 'owner',
        contentVersion: 1,
        attachmentId,
        attachmentChunkCount: 16,
        passcodeHash: '$argon2id$password-verifier',
    } as ShareLinkRecord;
    const now = new Date('2026-10-03T00:00:00Z');
    it('exposes neither password verifier nor identity scope and rejects changed bindings', () => {
        const token = mintShareAttachmentAccessToken(record, 'deployment', '203.0.113.1', now);
        const body = Buffer.from(token.split('.')[0]!, 'base64url').toString('utf8');
        expect(body).not.toContain('password-verifier');
        expect(body).not.toContain('owner');
        expect(body).not.toContain('deployment');
        expect(body).not.toContain('203.0.113.1');
        expect(
            verifyShareAttachmentAccessToken(token, record, 'deployment', '203.0.113.1', now)
        ).toBe(true);
        for (const changed of [
            { ...record, contentVersion: 2 },
            { ...record, attachmentId: randomUUID() },
            { ...record, attachmentChunkCount: 15 },
            { ...record, ownerProfileId: 'someone-else' },
            { ...record, passcodeHash: 'changed' },
        ]) {
            expect(
                verifyShareAttachmentAccessToken(token, changed, 'deployment', '203.0.113.1', now)
            ).toBe(false);
        }
        expect(verifyShareAttachmentAccessToken(token, record, 'foreign', '203.0.113.1', now)).toBe(
            false
        );
        expect(
            verifyShareAttachmentAccessToken(token, record, 'deployment', '203.0.113.2', now)
        ).toBe(false);
        expect(
            verifyShareAttachmentAccessToken(
                token,
                record,
                'deployment',
                '203.0.113.1',
                new Date(now.getTime() + 60_000)
            )
        ).toBe(false);
        expect(
            verifyShareAttachmentAccessToken(`${token}x`, record, 'deployment', '203.0.113.1', now)
        ).toBe(false);
    });
});
