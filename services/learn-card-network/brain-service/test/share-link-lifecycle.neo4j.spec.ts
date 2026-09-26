import { randomBytes } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { v4 as uuid } from 'uuid';

import { computeShareLinkRequestHash } from '@helpers/share-link-lifecycle';
import { neogma } from '@instance';

import {
    abandonReservation,
    claimCleanupJobs,
    completeCleanupJob,
    finalizeReservation,
    getCleanupJob,
    getCurrentShareContent,
    getShareLink,
    isShareLinkRepositoryError,
    listCleanupJobsForShare,
    reserveCreate,
    reserveReplacement,
    revokeShareLink,
} from '../src/accesslayer/share-link';
import { ensureShareLinkConstraints } from '../src/models/share-link-constraints';
import { toOwnerShareLink } from '../src/helpers/share-link-owner-projection';
import type { ShareLinkPolicySnapshot } from '../src/helpers/share-link-policy/types';
import { resolveCurrentShareLinkPolicy } from '../src/helpers/share-link-policy/production';
import type { ShareLinkRecord } from '../src/models/ShareLink';

import {
    nextShareId,
    contentBinding,
    clearLifecycleGraph,
    reserveShareFixture,
    type ReservedCreate,
} from './helpers/share-link-fixtures';

const NAMESPACE = 'localhost%3A3000';
const OTHER_NAMESPACE = 'other.example';
const NOW = new Date('2026-09-20T12:00:00.000Z');

const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object') {
        const maybeInteger = value as { toNumber?: () => number };
        if (typeof maybeInteger.toNumber === 'function') return maybeInteger.toNumber();
    }
    return Number.NaN;
};

const countNodes = async (label: string, key: string, value: string): Promise<number> => {
    const result = await neogma.queryRunner.run(
        `MATCH (n:${label} {${key}: $value}) RETURN count(n) AS total`,
        { value }
    );

    return toNumber(result.records[0]?.get('total'));
};

const reserveNewShare = async (options?: {
    ownerProfileId?: string;
    shareId?: string;
    expiresAt?: string | null;
    selectedCount?: number;
    now?: Date;
    clientRequestId?: string;
    requestHash?: string;
    namespace?: string;
}): Promise<ReservedCreate> => {
    return reserveShareFixture({
        ...options,
        namespace: options?.namespace ?? NAMESPACE,
        ownerProfileId: options?.ownerProfileId ?? `owner-${uuid()}`,
        now: options?.now ?? NOW,
    });
};
const commitNewShare = async (options?: Parameters<typeof reserveNewShare>[0]) => {
    const created = await reserveNewShare(options);

    const finalized = await finalizeReservation({
        namespace: created.namespace,
        ownerProfileId: created.ownerProfileId,
        shareId: created.shareId,
        operationId: created.operationId,
        objectRef: created.objectRef,
        generation: created.generation,
        leaseOwner: created.leaseOwner,
        now: options?.now ?? NOW,
    });

    if (finalized.outcome !== 'finalized') {
        throw new Error(`expected finalized create, got ${finalized.outcome}`);
    }

    return { ...created, committed: finalized.share };
};

const replacementHash = (shareId: string, seed: string): string =>
    computeShareLinkRequestHash('update', {
        id: shareId,
        ...contentBinding(seed),
        contentVersion: 2,
        selectedCount: 1,
    });

describe('share-link lifecycle repository (Neo4j)', () => {
    beforeAll(async () => {
        await ensureShareLinkConstraints();
    });

    beforeEach(async () => {
        await clearLifecycleGraph();
    });

    afterAll(async () => {
        await clearLifecycleGraph();
    });

    it('reserves, finalizes and serves one committed content reference', async () => {
        const created = await reserveNewShare();

        const staging = await getCurrentShareContent({ shareId: created.shareId, now: NOW });
        expect(staging.state).toBe('not_active');

        const finalized = await finalizeReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: created.operationId,
            objectRef: created.objectRef,
            generation: created.generation,
            leaseOwner: created.leaseOwner,
            now: NOW,
        });

        expect(finalized.outcome).toBe('finalized');
        if (finalized.outcome !== 'finalized') return;

        expect(finalized.share.status).toBe('active');
        expect(finalized.share.contentState).toBe('finalized');
        expect(finalized.share.activeObjectRef).toBe(created.objectRef);
        expect(finalized.share.contentVersion).toBe(1);
        expect(finalized.share.version).toBe(2);
        expect(finalized.cleanupQueuedFor).toBeNull();

        const current = await getCurrentShareContent({ shareId: created.shareId, now: NOW });
        expect(current.state).toBe('active');
        if (current.state === 'active') {
            expect(current.objectRef).toBe(created.objectRef);
            expect(current.contentVersion).toBe(1);
        }

        const repeat = await finalizeReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: created.operationId,
            objectRef: created.objectRef,
            generation: created.generation,
            leaseOwner: created.leaseOwner,
            now: NOW,
        });
        expect(repeat.outcome).toBe('already_finalized');
    });

    it('resumes an in-flight create with the same request and rejects a different input', async () => {
        const created = await reserveNewShare();

        const resumed = await reserveCreate({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: created.clientRequestId,
            shareId: created.shareId,
            title: 'Shared credentials',
            note: null,
            expiresAt: null,
            selectedCount: 1,
            content: contentBinding(created.shareId),
            requestHash: created.requestHash,
            leaseOwner: 'worker-2',
            now: new Date(NOW.getTime() + 1000),
        });

        expect(resumed.outcome).toBe('reserved');
        if (resumed.outcome === 'reserved') {
            expect(resumed.state).toBe('resumed');
            expect(resumed.reservation.objectRef).toBe(created.objectRef);
            expect(resumed.reservation.operationId).toBe(created.operationId);
        }

        await expect(
            reserveCreate({
                namespace: created.namespace,
                ownerProfileId: created.ownerProfileId,
                clientRequestId: created.clientRequestId,
                shareId: created.shareId,
                title: 'Different title',
                note: null,
                expiresAt: null,
                selectedCount: 1,
                content: contentBinding(created.shareId),
                requestHash: computeShareLinkRequestHash('create', {
                    id: created.shareId,
                    title: 'Different title',
                }),
                leaseOwner: 'worker-2',
                now: NOW,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('returns the recorded create result without rolling back a newer update', async () => {
        const created = await commitNewShare();

        const updateClientRequestId = uuid();
        const updateHash = replacementHash(created.shareId, created.shareId);
        const reserved = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: updateClientRequestId,
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: updateHash,
            leaseOwner: 'worker-1',
            now: NOW,
            content: {
                ...contentBinding(`${created.shareId}-v2`),
                contentVersion: 2,
                selectedCount: 1,
            },
        });

        expect(reserved.outcome).toBe('reserved');
        if (reserved.outcome !== 'reserved' || !reserved.reservation.objectRef) return;

        const finalized = await finalizeReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: reserved.reservation.operationId,
            objectRef: reserved.reservation.objectRef,
            generation: reserved.reservation.generation,
            leaseOwner: reserved.reservation.leaseOwner,
            now: NOW,
        });
        expect(finalized.outcome).toBe('finalized');
        if (finalized.outcome === 'finalized') {
            expect(finalized.share.version).toBe(3);
            expect(finalized.share.contentVersion).toBe(2);
        }

        const replay = await reserveCreate({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: created.clientRequestId,
            shareId: created.shareId,
            title: 'Shared credentials',
            note: null,
            expiresAt: null,
            selectedCount: 1,
            content: contentBinding(created.shareId),
            requestHash: created.requestHash,
            leaseOwner: 'worker-9',
            now: NOW,
        });

        expect(replay.outcome).toBe('already_committed');
        if (replay.outcome === 'already_committed') {
            expect(replay.recorded.version).toBe(2);
            expect(replay.current.version).toBe(3);
            expect(replay.current.contentVersion).toBe(2);
        }

        const share = await getShareLink({ shareId: created.shareId });
        expect(share?.version).toBe(3);
        expect(share?.contentVersion).toBe(2);
    });

    it('allows only one in-flight reservation for concurrent same-version updates', async () => {
        const created = await commitNewShare();

        const makeInput = (seed: string) => ({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: replacementHash(created.shareId, seed),
            leaseOwner: `worker-${seed}`,
            now: NOW,
            content: {
                ...contentBinding(seed),
                contentVersion: 2,
                selectedCount: 1,
            },
        });

        const results = await Promise.allSettled([
            reserveReplacement(makeInput('a')),
            reserveReplacement(makeInput('b')),
        ]);

        const fulfilled = results.filter(result => result.status === 'fulfilled');
        const rejected = results.filter(result => result.status === 'rejected');

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);

        const reason = (rejected[0] as PromiseRejectedResult).reason;
        expect(isShareLinkRepositoryError(reason) && reason.code).toBe('OPERATION_IN_FLIGHT');
        expect(await countNodes('ShareLinkReservation', 'shareId', created.shareId)).toBe(1);
    });

    it('expires a lease and fences a stale finalize while a newer reservation takes over', async () => {
        const created = await commitNewShare();
        const later = new Date(NOW.getTime() + 2000);

        const first = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: replacementHash(created.shareId, 'first'),
            leaseOwner: 'stale-worker',
            leaseMs: 1000,
            now: NOW,
            content: { ...contentBinding('first'), contentVersion: 2, selectedCount: 1 },
        });
        expect(first.outcome).toBe('reserved');
        if (first.outcome !== 'reserved' || !first.reservation.objectRef) return;

        await expect(
            finalizeReservation({
                namespace: created.namespace,
                ownerProfileId: created.ownerProfileId,
                shareId: created.shareId,
                operationId: first.reservation.operationId,
                objectRef: first.reservation.objectRef,
                generation: first.reservation.generation,
                leaseOwner: first.reservation.leaseOwner,
                now: later,
            })
        ).rejects.toMatchObject({ code: 'LEASE_EXPIRED' });

        const second = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: replacementHash(created.shareId, 'second'),
            leaseOwner: 'fresh-worker',
            now: later,
            content: { ...contentBinding('second'), contentVersion: 2, selectedCount: 1 },
        });
        expect(second.outcome).toBe('reserved');
        if (second.outcome !== 'reserved' || !second.reservation.objectRef) return;

        expect(second.reservation.generation).toBe(first.reservation.generation + 1);
        expect(second.reservation.objectRef).not.toBe(first.reservation.objectRef);

        await expect(
            finalizeReservation({
                namespace: created.namespace,
                ownerProfileId: created.ownerProfileId,
                shareId: created.shareId,
                operationId: first.reservation.operationId,
                objectRef: first.reservation.objectRef,
                generation: first.reservation.generation,
                leaseOwner: first.reservation.leaseOwner,
                now: later,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });

        const finalized = await finalizeReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: second.reservation.operationId,
            objectRef: second.reservation.objectRef,
            generation: second.reservation.generation,
            leaseOwner: second.reservation.leaseOwner,
            now: later,
        });
        expect(finalized.outcome).toBe('finalized');
        if (finalized.outcome === 'finalized') {
            expect(finalized.share.activeObjectRef).toBe(second.reservation.objectRef);
        }
    });

    it('resumes a crashed replacement reservation instead of allocating a second object', async () => {
        const created = await commitNewShare();
        const clientRequestId = uuid();
        const requestHash = replacementHash(created.shareId, 'resume');

        const first = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId,
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash,
            leaseOwner: 'worker-1',
            now: NOW,
            content: { ...contentBinding('resume'), contentVersion: 2, selectedCount: 1 },
        });
        expect(first.outcome).toBe('reserved');
        if (first.outcome !== 'reserved' || !first.reservation.objectRef) return;

        const second = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId,
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash,
            leaseOwner: 'worker-1',
            now: new Date(NOW.getTime() + 500),
            content: { ...contentBinding('resume'), contentVersion: 2, selectedCount: 1 },
        });

        expect(second.outcome).toBe('reserved');
        if (second.outcome === 'reserved') {
            expect(second.state).toBe('resumed');
            expect(second.reservation.objectRef).toBe(first.reservation.objectRef);
            expect(second.reservation.operationId).toBe(first.reservation.operationId);
        }
        expect(await countNodes('ShareLinkReservation', 'shareId', created.shareId)).toBe(1);
    });

    it('rejects a late finalize after the reservation is abandoned and never reuses the object id', async () => {
        const created = await commitNewShare();
        const clientRequestId = uuid();
        const requestHash = replacementHash(created.shareId, 'abandon');

        const staged = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId,
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash,
            leaseOwner: 'worker-1',
            now: NOW,
            content: { ...contentBinding('abandon'), contentVersion: 2, selectedCount: 1 },
        });
        expect(staged.outcome).toBe('reserved');
        if (staged.outcome !== 'reserved' || !staged.reservation.objectRef) return;

        const abandoned = await abandonReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: staged.reservation.operationId,
            generation: staged.reservation.generation,
            leaseOwner: staged.reservation.leaseOwner,
            now: NOW,
        });
        expect(abandoned.outcome).toBe('abandoned');
        if (abandoned.outcome === 'abandoned') {
            expect(abandoned.cleanupQueuedFor).toBe(staged.reservation.objectRef);
        }

        await expect(
            finalizeReservation({
                namespace: created.namespace,
                ownerProfileId: created.ownerProfileId,
                shareId: created.shareId,
                operationId: staged.reservation.operationId,
                objectRef: staged.reservation.objectRef,
                generation: staged.reservation.generation,
                leaseOwner: staged.reservation.leaseOwner,
                now: NOW,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });

        const redriven = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId,
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash,
            leaseOwner: 'worker-2',
            now: NOW,
            content: { ...contentBinding('abandon'), contentVersion: 2, selectedCount: 1 },
        });
        expect(redriven.outcome).toBe('reserved');
        if (redriven.outcome !== 'reserved' || !redriven.reservation.objectRef) return;
        expect(redriven.reservation.objectRef).not.toBe(staged.reservation.objectRef);

        const finalized = await finalizeReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: redriven.reservation.operationId,
            objectRef: redriven.reservation.objectRef,
            generation: redriven.reservation.generation,
            leaseOwner: redriven.reservation.leaseOwner,
            now: NOW,
        });
        expect(finalized.outcome).toBe('finalized');
    });

    it('serializes revoke with finalize and stops idempotently', async () => {
        const created = await commitNewShare();
        const staged = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: replacementHash(created.shareId, 'revoke'),
            leaseOwner: 'worker-1',
            now: NOW,
            content: { ...contentBinding('revoke'), contentVersion: 2, selectedCount: 1 },
        });
        expect(staged.outcome).toBe('reserved');
        if (staged.outcome !== 'reserved' || !staged.reservation.objectRef) return;

        const revokeClientRequestId = uuid();
        const revokeHash = computeShareLinkRequestHash('revoke', { id: created.shareId });

        const revoked = await revokeShareLink({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            clientRequestId: revokeClientRequestId,
            requestHash: revokeHash,
            now: NOW,
        });
        expect(revoked.outcome).toBe('revoked');
        expect(revoked.share.status).toBe('stopped');
        expect(revoked.cleanupQueuedFor).toEqual(
            expect.arrayContaining([created.objectRef, staged.reservation.objectRef])
        );

        await expect(
            finalizeReservation({
                namespace: created.namespace,
                ownerProfileId: created.ownerProfileId,
                shareId: created.shareId,
                operationId: staged.reservation.operationId,
                objectRef: staged.reservation.objectRef,
                generation: staged.reservation.generation,
                leaseOwner: staged.reservation.leaseOwner,
                now: NOW,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });

        const retry = await revokeShareLink({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            clientRequestId: revokeClientRequestId,
            requestHash: revokeHash,
            now: NOW,
        });
        expect(retry.outcome).toBe('already_stopped');
        expect((await getCurrentShareContent({ shareId: created.shareId, now: NOW })).state).toBe(
            'not_active'
        );
    });

    it('enqueues the superseded object cleanup in the same transaction as the swap', async () => {
        const created = await commitNewShare();
        const oldObjectRef = created.objectRef;

        const staged = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: replacementHash(created.shareId, 'swap'),
            leaseOwner: 'worker-1',
            now: NOW,
            content: { ...contentBinding('swap'), contentVersion: 2, selectedCount: 1 },
        });
        expect(staged.outcome).toBe('reserved');
        if (staged.outcome !== 'reserved' || !staged.reservation.objectRef) return;

        await expect(
            finalizeReservation({
                namespace: created.namespace,
                ownerProfileId: created.ownerProfileId,
                shareId: created.shareId,
                operationId: staged.reservation.operationId,
                objectRef: staged.reservation.objectRef,
                generation: staged.reservation.generation,
                leaseOwner: staged.reservation.leaseOwner,
                verifiedContentHash: '0'.repeat(64),
                now: NOW,
            })
        ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });

        expect(await getCleanupJob(oldObjectRef)).toBeNull();

        const before = await getShareLink({ shareId: created.shareId });
        expect(before?.activeObjectRef).toBe(oldObjectRef);
        expect(before?.version).toBe(2);

        const finalized = await finalizeReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: staged.reservation.operationId,
            objectRef: staged.reservation.objectRef,
            generation: staged.reservation.generation,
            leaseOwner: staged.reservation.leaseOwner,
            now: NOW,
        });
        expect(finalized.outcome).toBe('finalized');
        if (finalized.outcome !== 'finalized') return;

        expect(finalized.cleanupQueuedFor).toBe(oldObjectRef);
        expect(finalized.share.activeObjectRef).toBe(staged.reservation.objectRef);

        const job = await getCleanupJob(oldObjectRef);
        expect(job).toMatchObject({
            status: 'queued',
            reason: 'superseded',
            shareId: created.shareId,
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
        });
        expect(
            (await listCleanupJobsForShare(created.shareId)).map(entry => entry.objectRef)
        ).toEqual([oldObjectRef]);
    });

    it('fails closed for a wrong namespace or owner across every operation', async () => {
        const created = await commitNewShare();

        await expect(
            reserveReplacement({
                namespace: created.namespace,
                ownerProfileId: 'someone-else',
                clientRequestId: uuid(),
                shareId: created.shareId,
                expectedVersion: 2,
                requestHash: replacementHash(created.shareId, 'foreign'),
                leaseOwner: 'worker-1',
                now: NOW,
                content: { ...contentBinding('foreign'), contentVersion: 2, selectedCount: 1 },
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        await expect(
            finalizeReservation({
                namespace: created.namespace,
                ownerProfileId: 'someone-else',
                shareId: created.shareId,
                operationId: created.operationId,
                objectRef: created.objectRef,
                generation: created.generation,
                leaseOwner: created.leaseOwner,
                now: NOW,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        await expect(
            revokeShareLink({
                namespace: OTHER_NAMESPACE,
                ownerProfileId: created.ownerProfileId,
                shareId: created.shareId,
                now: NOW,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        await expect(
            abandonReservation({
                namespace: created.namespace,
                ownerProfileId: 'someone-else',
                shareId: created.shareId,
                operationId: created.operationId,
                now: NOW,
            })
        ).rejects.toMatchObject({ code: 'NOT_FOUND' });

        expect(
            await getShareLink({ shareId: created.shareId, ownerProfileId: 'someone-else' })
        ).toBeNull();
        expect(
            await getShareLink({ shareId: created.shareId, namespace: OTHER_NAMESPACE })
        ).toBeNull();
        expect(
            (
                await getCurrentShareContent({
                    shareId: created.shareId,
                    ownerProfileId: 'someone-else',
                    now: NOW,
                })
            ).state
        ).toBe('missing');
    });

    it('retains expired bytes and permits a metadata-only expiry extension', async () => {
        const created = await commitNewShare({ expiresAt: NOW.toISOString() });
        const afterExpiry = new Date(NOW.getTime() + 1000);

        const expired = await getCurrentShareContent({
            shareId: created.shareId,
            now: afterExpiry,
        });
        expect(expired.state).toBe('not_active');
        if (expired.state === 'not_active') expect(expired.reason).toBe('expired');

        const retained = await getShareLink({ shareId: created.shareId });
        expect(retained?.activeObjectRef).toBe(created.objectRef);

        const futureExpiry = new Date(NOW.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        const extensionHash = computeShareLinkRequestHash('update', {
            id: created.shareId,
            expiresAt: futureExpiry,
        });
        const reserved = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: extensionHash,
            leaseOwner: 'worker-1',
            now: NOW,
            expiresAt: futureExpiry,
        });
        expect(reserved.outcome).toBe('reserved');
        if (reserved.outcome !== 'reserved') return;
        expect(reserved.reservation.objectRef).toBeNull();

        const finalized = await finalizeReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: reserved.reservation.operationId,
            objectRef: null,
            generation: reserved.reservation.generation,
            leaseOwner: reserved.reservation.leaseOwner,
            now: NOW,
        });
        expect(finalized.outcome).toBe('finalized');
        if (finalized.outcome === 'finalized') {
            expect(finalized.share.contentVersion).toBe(1);
            expect(finalized.share.activeObjectRef).toBe(created.objectRef);
            expect(finalized.share.expiresAt).toBe(futureExpiry);
        }

        const active = await getCurrentShareContent({ shareId: created.shareId, now: afterExpiry });
        expect(active.state).toBe('active');
    });

    it('replaces, preserves, and removes share protection settings', async () => {
        const created = await commitNewShare();
        const policy: ShareLinkPolicySnapshot = {
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 365,
            viewCountingEnabled: true,
        };

        const protect = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: computeShareLinkRequestHash('update', {
                id: created.shareId,
                passcode: 'replacement',
                notifyOnView: true,
            }),
            passcodeHash: '$argon2id$replacement-hash',
            notifyOnView: true,
            policy,
            leaseOwner: 'worker-1',
            now: NOW,
        });
        if (protect.outcome !== 'reserved') throw new Error('expected protection reservation');

        const protectedShare = await finalizeReservation({
            ...protect.reservation,
            resolveCurrentPolicy: async () => policy,
            now: NOW,
        });
        if (protectedShare.outcome !== 'finalized') throw new Error('expected protected share');
        expect(protectedShare.share.passcodeHash).toBe('$argon2id$replacement-hash');
        expect(protectedShare.share.notifyOnView).toBe(true);

        const preserve = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: protectedShare.share.version,
            requestHash: computeShareLinkRequestHash('update', {
                id: created.shareId,
                title: 'Still protected',
            }),
            title: 'Still protected',
            policy,
            leaseOwner: 'worker-1',
            now: NOW,
        });
        if (preserve.outcome !== 'reserved') throw new Error('expected preserve reservation');

        const preservedShare = await finalizeReservation({
            ...preserve.reservation,
            now: NOW,
        });
        if (preservedShare.outcome !== 'finalized') throw new Error('expected preserved share');
        expect(preservedShare.share.passcodeHash).toBe('$argon2id$replacement-hash');
        expect(preservedShare.share.notifyOnView).toBe(true);

        const remove = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: preservedShare.share.version,
            requestHash: computeShareLinkRequestHash('update', {
                id: created.shareId,
                passcode: null,
                notifyOnView: false,
            }),
            passcodeHash: null,
            notifyOnView: false,
            policy,
            leaseOwner: 'worker-1',
            now: NOW,
        });
        if (remove.outcome !== 'reserved') throw new Error('expected removal reservation');

        const unprotectedShare = await finalizeReservation({
            ...remove.reservation,
            now: NOW,
        });
        if (unprotectedShare.outcome !== 'finalized') throw new Error('expected unprotected share');
        expect(unprotectedShare.share.passcodeHash).toBeNull();
        expect(unprotectedShare.share.notifyOnView).toBe(false);
    });

    it('claims, completes and backs off durable cleanup jobs with a fenced claim token', async () => {
        const created = await commitNewShare();
        const staged = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: replacementHash(created.shareId, 'cleanup'),
            leaseOwner: 'worker-1',
            now: NOW,
            content: { ...contentBinding('cleanup'), contentVersion: 2, selectedCount: 1 },
        });
        expect(staged.outcome).toBe('reserved');
        if (staged.outcome !== 'reserved' || !staged.reservation.objectRef) return;

        const finalized = await finalizeReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: staged.reservation.operationId,
            objectRef: staged.reservation.objectRef,
            generation: staged.reservation.generation,
            leaseOwner: staged.reservation.leaseOwner,
            now: NOW,
        });
        expect(finalized.outcome).toBe('finalized');

        const claimed = await claimCleanupJobs({
            namespace: created.namespace,
            claimant: 'cleaner-1',
            now: NOW,
        });
        expect(claimed.jobs.map(job => job.objectRef)).toContain(created.objectRef);

        const completed = await completeCleanupJob({
            objectRef: created.objectRef,
            claimToken: claimed.claimToken,
            outcome: 'completed',
            now: NOW,
        });
        expect(completed.outcome).toBe('completed');
        expect((await getCleanupJob(created.objectRef))?.status).toBe('completed');

        const abandoned = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: 3,
            requestHash: replacementHash(created.shareId, 'retry'),
            leaseOwner: 'worker-1',
            now: NOW,
            content: { ...contentBinding('retry'), contentVersion: 3, selectedCount: 1 },
        });
        expect(abandoned.outcome).toBe('reserved');
        if (abandoned.outcome !== 'reserved' || !abandoned.reservation.objectRef) return;

        const abandonResult = await abandonReservation({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: abandoned.reservation.operationId,
            generation: abandoned.reservation.generation,
            leaseOwner: abandoned.reservation.leaseOwner,
            now: NOW,
        });
        expect(abandonResult.outcome).toBe('abandoned');

        const retryRef = abandoned.reservation.objectRef;
        const claimedRetry = await claimCleanupJobs({
            namespace: created.namespace,
            claimant: 'cleaner-1',
            now: NOW,
        });
        expect(claimedRetry.jobs.map(job => job.objectRef)).toContain(retryRef);

        const retried = await completeCleanupJob({
            objectRef: retryRef,
            claimToken: claimedRetry.claimToken,
            outcome: 'retry',
            errorMessage: 'throttled',
            now: NOW,
        });
        expect(retried.outcome).toBe('retry');
        if (retried.outcome === 'retry') {
            expect(retried.job.status).toBe('queued');
            expect(retried.job.attempts).toBe(1);
            expect(Date.parse(retried.job.nextAttemptAt)).toBeGreaterThan(NOW.getTime());
        }

        expect(
            await completeCleanupJob({
                objectRef: retryRef,
                claimToken: 'not-the-claim',
                outcome: 'completed',
                now: NOW,
            })
        ).toEqual({ outcome: 'claim_lost' });
    });

    it('lets exactly one of two concurrent finalizes commit the swap', async () => {
        const created = await commitNewShare();
        const staged = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: replacementHash(created.shareId, 'double-finalize'),
            leaseOwner: 'worker-1',
            now: NOW,
            content: { ...contentBinding('double-finalize'), contentVersion: 2, selectedCount: 1 },
        });
        expect(staged.outcome).toBe('reserved');
        if (staged.outcome !== 'reserved' || !staged.reservation.objectRef) return;

        const finalizeInput = {
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            shareId: created.shareId,
            operationId: staged.reservation.operationId,
            objectRef: staged.reservation.objectRef,
            generation: staged.reservation.generation,
            leaseOwner: staged.reservation.leaseOwner,
            now: NOW,
        } as const;

        const results = await Promise.allSettled([
            finalizeReservation({ ...finalizeInput }),
            finalizeReservation({ ...finalizeInput }),
        ]);

        const outcomes = results.map(result =>
            result.status === 'fulfilled' ? result.value.outcome : 'rejected'
        );
        expect(outcomes).toContain('finalized');
        expect(outcomes).toContain('already_finalized');

        const share = await getShareLink({ shareId: created.shareId });
        expect(share?.activeObjectRef).toBe(staged.reservation.objectRef);
        expect(await countNodes('ShareLinkReservation', 'shareId', created.shareId)).toBe(0);
        expect(
            (await listCleanupJobsForShare(created.shareId)).filter(
                job => job.objectRef === created.objectRef
            )
        ).toHaveLength(1);
    });

    it('keeps revoke as the terminal winner against a concurrent finalize', async () => {
        const created = await commitNewShare();
        const staged = await reserveReplacement({
            namespace: created.namespace,
            ownerProfileId: created.ownerProfileId,
            clientRequestId: uuid(),
            shareId: created.shareId,
            expectedVersion: created.committed.version,
            requestHash: replacementHash(created.shareId, 'race-revoke'),
            leaseOwner: 'worker-1',
            now: NOW,
            content: { ...contentBinding('race-revoke'), contentVersion: 2, selectedCount: 1 },
        });
        expect(staged.outcome).toBe('reserved');
        if (staged.outcome !== 'reserved' || !staged.reservation.objectRef) return;

        const outcomes = await Promise.allSettled([
            finalizeReservation({
                namespace: created.namespace,
                ownerProfileId: created.ownerProfileId,
                shareId: created.shareId,
                operationId: staged.reservation.operationId,
                objectRef: staged.reservation.objectRef,
                generation: staged.reservation.generation,
                leaseOwner: staged.reservation.leaseOwner,
                now: NOW,
            }),
            revokeShareLink({
                namespace: created.namespace,
                ownerProfileId: created.ownerProfileId,
                shareId: created.shareId,
                now: NOW,
            }),
        ]);

        expect(outcomes[1].status).toBe('fulfilled');
        const share: ShareLinkRecord | null = await getShareLink({ shareId: created.shareId });
        expect(share?.status).toBe('stopped');
        expect(await countNodes('ShareLinkReservation', 'shareId', created.shareId)).toBe(0);
    });
    it('rejects an abandoned metadata retry after stop or a newer committed version', async () => {
        for (const stop of [true, false]) {
            const created = await commitNewShare();
            const input = {
                namespace: created.namespace,
                ownerProfileId: created.ownerProfileId,
                shareId: created.shareId,
                clientRequestId: uuid(),
                expectedVersion: created.committed.version,
                requestHash: replacementHash(created.shareId, 'metadata'),
                leaseOwner: 'worker-1',
                now: NOW,
                title: 'Old title',
            };
            const staged = await reserveReplacement(input);
            if (staged.outcome !== 'reserved') throw new Error('expected reservation');
            await abandonReservation({ ...input, operationId: staged.reservation.operationId });
            if (stop) await revokeShareLink(input);
            else {
                const newer = await reserveReplacement({
                    ...input,
                    clientRequestId: uuid(),
                    requestHash: replacementHash(created.shareId, 'newer'),
                    title: 'New title',
                });
                if (newer.outcome !== 'reserved') throw new Error('expected reservation');
                await finalizeReservation({ ...input, ...newer.reservation });
            }
            await expect(reserveReplacement(input)).rejects.toMatchObject({ code: 'CONFLICT' });
        }
    });

    it('preserves object operation binding across metadata updates and cleanup', async () => {
        const created = await commitNewShare();
        const staged = await reserveReplacement({
            ...created,
            expectedVersion: created.committed.version,
            clientRequestId: uuid(),
            requestHash: replacementHash(created.shareId, 'metadata-binding'),
            title: 'Renamed',
            now: NOW,
        });
        if (staged.outcome !== 'reserved') throw new Error('expected reservation');
        await finalizeReservation({ ...staged.reservation, now: NOW });
        const content = await getCurrentShareContent({ shareId: created.shareId, now: NOW });
        expect(content.state === 'active' && content.operationId).toBe(created.operationId);
        await revokeShareLink({ ...created, now: NOW });
        const jobs = await listCleanupJobsForShare(created.shareId);
        expect(jobs.find(job => job.objectRef === created.objectRef)?.operationId).toBe(
            created.operationId
        );
        const claims = await Promise.all([
            claimCleanupJobs({ namespace: created.namespace, claimant: 'a', now: NOW }),
            claimCleanupJobs({ namespace: created.namespace, claimant: 'b', now: NOW }),
        ]);
        expect(claims.flatMap(claim => claim.jobs)).toHaveLength(1);
    });

    it('persists the reservation policy snapshot and only tightens it at finalize', async () => {
        const permissive: ShareLinkPolicySnapshot = {
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 365,
            viewCountingEnabled: true,
        };
        const restrictive: ShareLinkPolicySnapshot = {
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 30,
            viewCountingEnabled: false,
        };

        const namespace = NAMESPACE;
        const ownerProfileId = `owner-${uuid()}`;
        const shareId = nextShareId();
        const content = contentBinding('policy');

        const reserved = await reserveCreate({
            namespace,
            ownerProfileId,
            clientRequestId: uuid(),
            shareId,
            title: 'Shared credentials',
            note: null,
            expiresAt: null,
            selectedCount: 1,
            content,
            requestHash: computeShareLinkRequestHash('create', {
                id: shareId,
                title: 'Shared credentials',
            }),
            leaseOwner: 'worker-1',
            policy: permissive,
            now: NOW,
        });
        if (reserved.outcome !== 'reserved' || !reserved.reservation.objectRef) {
            throw new Error('expected reserved create');
        }

        // The reservation persists the exact server-derived snapshot.
        expect(reserved.reservation.policy).toEqual(permissive);

        await finalizeReservation({ ...reserved.reservation, now: NOW });

        const afterCreate = (await getShareLink({ shareId })) as ShareLinkRecord;
        expect(afterCreate.minorPolicyViewCountingEnabled).toBe(true);
        expect(afterCreate.minorPolicyDefaultExpiryDays).toBe(365);
        expect(toOwnerShareLink(afterCreate).minorPolicy.viewCountingEnabled).toBe(true);

        // A genuinely restrictive later reservation tightens the committed policy.
        const restrictiveReservation = await reserveReplacement({
            namespace,
            ownerProfileId,
            clientRequestId: uuid(),
            shareId,
            expectedVersion: afterCreate.version,
            requestHash: computeShareLinkRequestHash('update', {
                id: shareId,
                title: 'Restricted',
            }),
            title: 'Restricted',
            leaseOwner: 'worker-1',
            policy: restrictive,
            now: NOW,
        });
        if (restrictiveReservation.outcome !== 'reserved') {
            throw new Error('expected restrictive reservation');
        }
        await finalizeReservation({ ...restrictiveReservation.reservation, now: NOW });

        const afterRestrictive = (await getShareLink({ shareId })) as ShareLinkRecord;
        expect(afterRestrictive.minorPolicyViewCountingEnabled).toBe(false);
        expect(afterRestrictive.minorPolicyDefaultExpiryDays).toBe(30);
        expect(toOwnerShareLink(afterRestrictive).minorPolicy.viewCountingEnabled).toBe(false);

        // A stale permissive replay/reservation can never re-enable view counting.
        const permissiveAgain = await reserveReplacement({
            namespace,
            ownerProfileId,
            clientRequestId: uuid(),
            shareId,
            expectedVersion: afterRestrictive.version,
            requestHash: computeShareLinkRequestHash('update', { id: shareId, title: 'Loosen' }),
            title: 'Loosen',
            leaseOwner: 'worker-1',
            policy: permissive,
            now: NOW,
        });
        if (permissiveAgain.outcome !== 'reserved') {
            throw new Error('expected permissive replay reservation');
        }
        await finalizeReservation({ ...permissiveAgain.reservation, now: NOW });

        const afterReplay = (await getShareLink({ shareId })) as ShareLinkRecord;
        expect(afterReplay.minorPolicyViewCountingEnabled).toBe(false);
        expect(afterReplay.minorPolicyDefaultExpiryDays).toBe(30);
        expect(toOwnerShareLink(afterReplay).minorPolicy.viewCountingEnabled).toBe(false);
    });

    it('upgrades an unknown share on explicit edit only after a fresh persisted adult check', async () => {
        const ownerProfileId = `policy-owner-${uuid()}`;
        const created = await commitNewShare({ ownerProfileId });
        expect(created.committed.minorPolicyViewCountingEnabled).toBe(false);

        const adultPolicy: ShareLinkPolicySnapshot = {
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 365,
            viewCountingEnabled: true,
        };

        await neogma.queryRunner.run('CREATE (:Profile {profileId: $profileId, dob: $dob})', {
            profileId: ownerProfileId,
            dob: '1990-01-01',
        });

        try {
            const update = await reserveReplacement({
                namespace: created.namespace,
                ownerProfileId,
                shareId: created.shareId,
                expectedVersion: created.committed.version,
                clientRequestId: uuid(),
                requestHash: replacementHash(created.shareId, 'adult-policy-edit'),
                notifyOnView: true,
                leaseOwner: 'worker-1',
                policy: adultPolicy,
                now: NOW,
            });
            if (update.outcome !== 'reserved') throw new Error('expected reservation');

            const finalized = await finalizeReservation({
                ...update.reservation,
                resolveCurrentPolicy: resolveCurrentShareLinkPolicy,
                now: NOW,
            });
            expect(finalized.share.minorPolicyViewCountingEnabled).toBe(true);
            expect(finalized.share.notifyOnView).toBe(true);

            // A newly managed profile must not retain the opt-in on a later edit.
            await neogma.queryRunner.run(
                `MATCH (p:Profile {profileId: $profileId})
                 CREATE (p)-[:MANAGED_BY]->(:Profile {profileId: $managerId})`,
                { profileId: ownerProfileId, managerId: `manager-${uuid()}` }
            );
            const restricted = await reserveReplacement({
                namespace: created.namespace,
                ownerProfileId,
                shareId: created.shareId,
                expectedVersion: finalized.share.version,
                clientRequestId: uuid(),
                requestHash: replacementHash(created.shareId, 'managed-policy-edit'),
                notifyOnView: true,
                leaseOwner: 'worker-1',
                policy: adultPolicy,
                now: NOW,
            });
            if (restricted.outcome !== 'reserved') throw new Error('expected reservation');
            const afterRestriction = await finalizeReservation({
                ...restricted.reservation,
                resolveCurrentPolicy: resolveCurrentShareLinkPolicy,
                now: NOW,
            });
            expect(afterRestriction.share.minorPolicyViewCountingEnabled).toBe(false);
            expect(afterRestriction.share.notifyOnView).toBe(false);
        } finally {
            await neogma.queryRunner.run(
                `MATCH (p:Profile {profileId: $profileId})
                 OPTIONAL MATCH (p)-[:MANAGED_BY]->(manager:Profile)
                 DETACH DELETE p, manager`,
                { profileId: ownerProfileId }
            );
        }
    });
});
