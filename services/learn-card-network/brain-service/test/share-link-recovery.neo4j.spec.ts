import { createHash, randomBytes } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { v4 as uuid } from 'uuid';

import { computeLeaseExpiry, computeShareLinkRequestHash } from '@helpers/share-link-lifecycle';
import {
    recoverShareLinkOperation,
    runShareLinkRecoveryOnce,
} from '@helpers/share-link-coordinator';
import { neogma } from '@instance';

import {
    abandonRecoveredReservation,
    claimRecoverableReservation,
    discoverRecoverableReservations,
    finalizeReservation,
    getShareLink,
    listCleanupJobsForShare,
    readShareLinkRecoveryTarget,
    reserveCreate,
    reserveReplacement,
    revokeShareLink,
} from '../src/accesslayer/share-link';
import type { ShareLinkRecoveryKey } from '../src/accesslayer/share-link';
import { ensureShareLinkConstraints } from '../src/models/share-link-constraints';
import type { ShareContentClient } from '../src/helpers/share-content-client';

/**
 * LC-2187 durable reservation recovery against a REAL Neo4j repository.
 *
 * These specs prove the persisted-state claim/reclaim fences, not remote
 * storage. The coordinator's stat verification is covered by the DB-free
 * recovery unit spec; the reviewed C4 HTTP endpoint remains separate evidence.
 */

const NAMESPACE = 'test-namespace';
const OTHER_NAMESPACE = 'other.example';
const OWNER = 'owner-1';
const BASE = new Date('2026-09-20T12:00:00.000Z');
const AFTER_EXPIRY = new Date(BASE.getTime() + 5_000);

const nextShareId = (): string => randomBytes(16).toString('base64url');

const contentBinding = (seed: string) => ({
    contentHash: createHash('sha256').update(`content:${seed}`).digest('hex'),
    contentBytes: 128,
    recoveryHash: createHash('sha256').update(`recovery:${seed}`).digest('hex'),
    recoveryBytes: 256,
});

const clearLifecycleGraph = async (): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (n)
         WHERE n:ShareLink OR n:ShareLinkReservation OR n:ShareLinkOperation OR n:ShareContentCleanupJob
         DETACH DELETE n`
    );
};

const readReservationProps = async (shareId: string): Promise<Record<string, unknown> | null> => {
    const result = await neogma.queryRunner.run(
        'MATCH (r:ShareLinkReservation {shareId: $shareId}) RETURN r LIMIT 1',
        { shareId }
    );

    return (
        (result.records[0]?.get('r') as { properties?: Record<string, unknown> } | undefined)
            ?.properties ?? null
    );
};

type ReservedCreate = {
    namespace: string;
    ownerProfileId: string;
    shareId: string;
    clientRequestId: string;
    requestHash: string;
    operationId: string;
    objectRef: string;
    generation: number;
    leaseOwner: string;
};

const reserveNewShare = async (options?: {
    namespace?: string;
    ownerProfileId?: string;
    shareId?: string;
    clientRequestId?: string;
    requestHash?: string;
    leaseMs?: number;
    now?: Date;
    title?: string;
}): Promise<ReservedCreate> => {
    const namespace = options?.namespace ?? NAMESPACE;
    const ownerProfileId = options?.ownerProfileId ?? OWNER;
    const shareId = options?.shareId ?? nextShareId();
    const clientRequestId = options?.clientRequestId ?? uuid();
    const content = contentBinding(shareId);
    const requestHash =
        options?.requestHash ??
        computeShareLinkRequestHash('create', {
            id: shareId,
            title: options?.title ?? 'Shared credentials',
            selectedCount: 1,
            ...content,
        });

    const result = await reserveCreate({
        namespace,
        ownerProfileId,
        clientRequestId,
        shareId,
        title: options?.title ?? 'Shared credentials',
        note: null,
        expiresAt: null,
        selectedCount: 1,
        content,
        requestHash,
        leaseOwner: 'worker-1',
        leaseMs: options?.leaseMs,
        now: options?.now ?? BASE,
    });

    if (result.outcome !== 'reserved' || !result.reservation.objectRef) {
        throw new Error(`expected reserved create, got ${result.outcome}`);
    }

    return {
        namespace,
        ownerProfileId,
        shareId,
        clientRequestId,
        requestHash,
        operationId: result.reservation.operationId,
        objectRef: result.reservation.objectRef,
        generation: result.reservation.generation,
        leaseOwner: result.reservation.leaseOwner,
    };
};

const commitNewShare = async (options?: {
    namespace?: string;
    ownerProfileId?: string;
    shareId?: string;
    now?: Date;
}) => {
    const created = await reserveNewShare({ ...options, now: options?.now ?? BASE });

    const finalized = await finalizeReservation({
        namespace: created.namespace,
        ownerProfileId: created.ownerProfileId,
        shareId: created.shareId,
        operationId: created.operationId,
        objectRef: created.objectRef,
        generation: created.generation,
        leaseOwner: created.leaseOwner,
        now: options?.now ?? BASE,
    });

    if (finalized.outcome !== 'finalized') {
        throw new Error(`expected finalized create, got ${finalized.outcome}`);
    }

    return { ...created, committed: finalized.share };
};

const keyFor = (
    created: Pick<ReservedCreate, 'namespace' | 'ownerProfileId' | 'shareId' | 'operationId'>
): ShareLinkRecoveryKey => ({
    namespace: created.namespace,
    ownerProfileId: created.ownerProfileId,
    shareId: created.shareId,
    operationId: created.operationId,
});

const reserveReplacementContent = async (options: {
    created: { namespace: string; ownerProfileId: string; shareId: string; objectRef: string };
    seed: string;
    contentVersion: number;
    leaseMs?: number;
    now?: Date;
    clientRequestId?: string;
}) => {
    const content = contentBinding(options.seed);
    const clientRequestId = options.clientRequestId ?? uuid();
    const requestHash = computeShareLinkRequestHash('update', {
        id: options.created.shareId,
        ...content,
        contentVersion: options.contentVersion,
        selectedCount: 1,
    });

    const result = await reserveReplacement({
        namespace: options.created.namespace,
        ownerProfileId: options.created.ownerProfileId,
        clientRequestId,
        shareId: options.created.shareId,
        expectedVersion: 2,
        requestHash,
        leaseOwner: 'worker-2',
        leaseMs: options.leaseMs,
        now: options.now ?? BASE,
        content: {
            ...content,
            contentVersion: options.contentVersion,
            selectedCount: 1,
        },
    });

    if (result.outcome !== 'reserved' || !result.reservation.objectRef) {
        throw new Error(`expected reserved replacement, got ${result.outcome}`);
    }

    return { clientRequestId, requestHash, reservation: result.reservation };
};

const recoveryRepository = {
    discoverRecoverableReservations,
    readShareLinkRecoveryTarget,
    claimRecoverableReservation,
    abandonRecoveredReservation,
    finalizeReservation,
};

const fakeStat = (overrides: Record<string, unknown> = {}) =>
    vi.fn(async () => ({
        ok: true as const,
        value: {
            kind: 'active' as const,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId: '',
            contentVersion: 1,
            objectId: '',
            operationId: '',
            contentHash: 'f'.repeat(64),
            payloadHash: '',
            ciphertextBytes: 128,
            recoveryBytes: 256,
            createdAt: '2026-09-20T12:00:00.000Z',
            ...overrides,
        },
    }));

const recoveryDependencies = (stat: ShareContentClient['stat']) => ({
    repository: recoveryRepository,
    client: { stat } as Pick<ShareContentClient, 'stat'>,
    claimant: 'recovery-1',
    namespace: NAMESPACE,
    leaseMs: 60_000,
    now: () => AFTER_EXPIRY,
});

describe('share-link recovery runner (real Neo4j, LABELED fake LearnCloud)', () => {
    beforeAll(async () => {
        await ensureShareLinkConstraints();
    });

    beforeEach(async () => {
        await clearLifecycleGraph();
    });

    afterAll(async () => {
        await clearLifecycleGraph();
    });

    it('finalizes a put-before-finalize reservation via bounded discovery + claim + stat', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const stat = fakeStat({
            shareId: created.shareId,
            objectId: created.objectRef,
            operationId: created.operationId,
            payloadHash: contentBinding(created.shareId).contentHash,
        });

        const summary = await runShareLinkRecoveryOnce(
            recoveryDependencies(stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({
            discovered: 1,
            claimed: 1,
            finalized: 1,
            categories: { finalized: 1 },
        });

        const share = await getShareLink({ shareId: created.shareId });
        expect(share?.contentState).toBe('finalized');
        expect(share?.activeObjectRef).toBe(created.objectRef);
        expect(share?.activeObjectOperationId).toBe(created.operationId);
    });

    it('abandons a missing object and queues exact-object cleanup', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const stat = vi.fn(async () => ({ ok: false as const, error: 'NOT_FOUND' as const }));

        const summary = await runShareLinkRecoveryOnce(
            recoveryDependencies(stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({
            discovered: 1,
            claimed: 1,
            abandoned: 1,
            categories: { abandoned_missing: 1 },
        });

        const jobs = await listCleanupJobsForShare(created.shareId);
        expect(jobs.map(job => job.objectRef)).toContain(created.objectRef);
    });

    it('abandons a permanent tombstone under the live recovery fence', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const stat = vi.fn(async () => ({
            ok: true as const,
            value: {
                kind: 'tombstone' as const,
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId: created.shareId,
                contentVersion: 1,
                objectId: created.objectRef,
                operationId: created.operationId,
                deletedAt: '2026-09-20T12:00:00.000Z',
            },
        }));

        const summary = await runShareLinkRecoveryOnce(
            recoveryDependencies(stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ abandoned: 1, categories: { abandoned_tombstone: 1 } });
    });

    it('observes committed state after finalize response loss without any storage I/O', async () => {
        const committed = await commitNewShare();
        const stat = vi.fn();

        const result = await recoverShareLinkOperation(
            recoveryDependencies(stat as unknown as ShareContentClient['stat']),
            keyFor(committed)
        );

        expect(result).toEqual({
            status: 'committed',
            share: expect.objectContaining({ activeObjectRef: committed.objectRef }),
        });
        expect(stat).not.toHaveBeenCalled();
    });

    it('recovers a scoped live reservation to a committed share', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const stat = fakeStat({
            shareId: created.shareId,
            objectId: created.objectRef,
            operationId: created.operationId,
            payloadHash: contentBinding(created.shareId).contentHash,
        });

        const result = await recoverShareLinkOperation(
            recoveryDependencies(stat as unknown as ShareContentClient['stat']),
            keyFor(created)
        );

        expect(result.status).toBe('committed');
        expect(stat).toHaveBeenCalledTimes(1);
    });
});

describe('share-link durable reservation recovery (Neo4j)', () => {
    beforeAll(async () => {
        await ensureShareLinkConstraints();
    });

    beforeEach(async () => {
        await clearLifecycleGraph();
    });

    afterAll(async () => {
        await clearLifecycleGraph();
    });

    it.each(['generation', 'version', 'status'])(
        'does not normalize a malformed share %s into recovery eligibility',
        async field => {
            const created = await reserveNewShare({ leaseMs: 1_000 });
            await neogma.queryRunner.run('MATCH (s:ShareLink {id: $id}) SET s += $props', {
                id: created.shareId,
                props: { [field]: 'corrupt' },
            });
            const result = await claimRecoverableReservation({
                ...keyFor(created),
                leaseOwner: 'review',
                now: AFTER_EXPIRY,
            });
            expect(result).toMatchObject({ outcome: 'not_claimable', reason: 'malformed_binding' });
            expect(await listCleanupJobsForShare(created.shareId)).toEqual([]);
        }
    );

    it('rejects a reservation whose request hash differs from its operation', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        await neogma.queryRunner.run(
            'MATCH (r:ShareLinkReservation {shareId: $id}) SET r.requestHash = $hash',
            {
                id: created.shareId,
                hash: 'a'.repeat(64),
            }
        );
        expect(
            await claimRecoverableReservation({
                ...keyFor(created),
                leaseOwner: 'review',
                now: AFTER_EXPIRY,
            })
        ).toMatchObject({ outcome: 'not_claimable', reason: 'binding_mismatch' });
    });

    it('refuses recovered abandonment after the share generation changes independently', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const claim = await claimRecoverableReservation({
            ...keyFor(created),
            leaseOwner: 'review',
            now: AFTER_EXPIRY,
        });
        expect(claim.outcome).toBe('claimed');
        if (claim.outcome !== 'claimed') throw new Error('claim failed');
        await neogma.queryRunner.run(
            'MATCH (s:ShareLink {id: $id}) SET s.generation = s.generation + 1',
            { id: created.shareId }
        );
        expect(
            await abandonRecoveredReservation({
                ...keyFor(created),
                leaseOwner: 'review',
                generation: claim.reservation.generation,
                now: AFTER_EXPIRY,
            })
        ).toMatchObject({ outcome: 'not_claimable', reason: 'stale_generation' });
        expect(await listCleanupJobsForShare(created.shareId)).toEqual([]);
    });

    it.each([
        { selectedCount: 0 },
        { title: null },
        {
            objectRef: null,
            contentVersion: null,
            contentHash: null,
            contentBytes: null,
            recoveryHash: null,
            recoveryBytes: null,
        },
    ])('rejects malformed persisted creation intent %j', async props => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        await neogma.queryRunner.run(
            'MATCH (r:ShareLinkReservation {shareId: $id}) SET r += $props',
            { id: created.shareId, props }
        );
        expect(
            await claimRecoverableReservation({
                ...keyFor(created),
                leaseOwner: 'review',
                now: AFTER_EXPIRY,
            })
        ).toMatchObject({ outcome: 'not_claimable', reason: 'malformed_binding' });
    });

    it('discovers and claims only an expired in-flight reservation, preserving the tuple', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const key = keyFor(created);

        const target = await readShareLinkRecoveryTarget(key);
        expect(target.state).toBe('reservation');
        if (target.state !== 'reservation') return;
        expect(target.reservation.operationId).toBe(created.operationId);
        expect(target.reservation.objectRef).toBe(created.objectRef);

        const notYet = await discoverRecoverableReservations({
            namespace: NAMESPACE,
            now: BASE,
        });
        expect(notYet.keys).toHaveLength(0);

        const discovery = await discoverRecoverableReservations({
            namespace: NAMESPACE,
            now: AFTER_EXPIRY,
        });
        expect(discovery.keys).toEqual([key]);

        const claimed = await claimRecoverableReservation({
            ...key,
            leaseOwner: 'recovery-1',
            leaseMs: 60_000,
            now: AFTER_EXPIRY,
        });

        expect(claimed.outcome).toBe('claimed');
        if (claimed.outcome !== 'claimed') return;

        expect(claimed.reservation.generation).toBe(created.generation + 1);
        expect(claimed.share.generation).toBe(created.generation + 1);
        expect(claimed.reservation.operationId).toBe(created.operationId);
        expect(claimed.reservation.objectRef).toBe(created.objectRef);
        expect(claimed.reservation.contentHash).toBe(contentBinding(created.shareId).contentHash);
        expect(claimed.reservation.requestHash).toBe(created.requestHash);
        expect(claimed.reservation.leaseOwner).toBe('recovery-1');
        expect(claimed.reservation.leaseExpiresAt).toBe(computeLeaseExpiry(AFTER_EXPIRY, 60_000));

        const finalized = await finalizeReservation({
            namespace: claimed.reservation.namespace,
            ownerProfileId: claimed.reservation.ownerProfileId,
            shareId: claimed.reservation.shareId,
            operationId: claimed.reservation.operationId,
            objectRef: claimed.reservation.objectRef,
            generation: claimed.reservation.generation,
            leaseOwner: claimed.reservation.leaseOwner,
            now: AFTER_EXPIRY,
        });

        expect(finalized.outcome).toBe('finalized');
        if (finalized.outcome !== 'finalized') return;
        expect(finalized.share.activeObjectRef).toBe(created.objectRef);
        expect(finalized.share.activeObjectOperationId).toBe(created.operationId);
    });

    it('exposes committed current state for a response-loss retry without a live reservation', async () => {
        const committed = await commitNewShare();

        const target = await readShareLinkRecoveryTarget(keyFor(committed));
        expect(target.state).toBe('committed');
        if (target.state !== 'committed') return;
        expect(target.share.version).toBe(committed.committed.version);
        expect(target.share.activeObjectRef).toBe(committed.objectRef);

        const discovery = await discoverRecoverableReservations({
            namespace: NAMESPACE,
            now: AFTER_EXPIRY,
        });
        expect(discovery.keys).toHaveLength(0);
    });

    it('requires an explicit namespace and bounds the discovery batch', async () => {
        const first = await reserveNewShare({ leaseMs: 1_000 });
        const second = await reserveNewShare({ leaseMs: 1_000, namespace: OTHER_NAMESPACE });
        const third = await reserveNewShare({ leaseMs: 1_000 });

        const scoped = await discoverRecoverableReservations({
            namespace: NAMESPACE,
            now: AFTER_EXPIRY,
        });
        expect(scoped.keys).toHaveLength(2);
        expect(scoped.keys.every(key => key.namespace === NAMESPACE)).toBe(true);

        const limited = await discoverRecoverableReservations({
            namespace: NAMESPACE,
            limit: 1,
            now: AFTER_EXPIRY,
        });
        expect(limited.keys).toHaveLength(1);

        const other = await discoverRecoverableReservations({
            namespace: OTHER_NAMESPACE,
            now: AFTER_EXPIRY,
        });
        expect(other.keys).toHaveLength(1);
        expect(other.keys[0]?.shareId).toBe(second.shareId);

        // The active first/third leases are not selected at BASE.
        const active = await discoverRecoverableReservations({
            namespace: NAMESPACE,
            now: BASE,
        });
        expect(active.keys).toHaveLength(0);
        expect(first.shareId).not.toBe(second.shareId);
        expect(third.shareId).not.toBe(first.shareId);
    });

    it('lets exactly one of two concurrent claims win', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const key = keyFor(created);

        const [first, second] = await Promise.all([
            claimRecoverableReservation({
                ...key,
                leaseOwner: 'recovery-1',
                leaseMs: 60_000,
                now: AFTER_EXPIRY,
            }),
            claimRecoverableReservation({
                ...key,
                leaseOwner: 'recovery-2',
                leaseMs: 60_000,
                now: AFTER_EXPIRY,
            }),
        ]);

        const outcomes = [first.outcome, second.outcome].sort();
        expect(outcomes).toEqual(['claimed', 'not_claimable']);

        const share = await getShareLink({ shareId: created.shareId });
        expect(share?.generation).toBe(created.generation + 1);

        const reservation = await readReservationProps(created.shareId);
        expect(reservation?.generation).toBe(created.generation + 1);
    });

    it('reclaims after lease expiry and fences the superseded generation', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const key = keyFor(created);

        const first = await claimRecoverableReservation({
            ...key,
            leaseOwner: 'recovery-1',
            leaseMs: 1_000,
            now: AFTER_EXPIRY,
        });
        expect(first.outcome).toBe('claimed');
        if (first.outcome !== 'claimed') return;

        const reclaimAt = new Date(AFTER_EXPIRY.getTime() + 5_000);
        const second = await claimRecoverableReservation({
            ...key,
            leaseOwner: 'recovery-2',
            leaseMs: 60_000,
            now: reclaimAt,
        });
        expect(second.outcome).toBe('claimed');
        if (second.outcome !== 'claimed') return;
        expect(second.reservation.generation).toBe(first.reservation.generation + 1);

        await expect(
            finalizeReservation({
                namespace: first.reservation.namespace,
                ownerProfileId: first.reservation.ownerProfileId,
                shareId: first.reservation.shareId,
                operationId: first.reservation.operationId,
                objectRef: first.reservation.objectRef,
                generation: first.reservation.generation,
                leaseOwner: first.reservation.leaseOwner,
                now: reclaimAt,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });

        const finalized = await finalizeReservation({
            namespace: second.reservation.namespace,
            ownerProfileId: second.reservation.ownerProfileId,
            shareId: second.reservation.shareId,
            operationId: second.reservation.operationId,
            objectRef: second.reservation.objectRef,
            generation: second.reservation.generation,
            leaseOwner: second.reservation.leaseOwner,
            now: reclaimAt,
        });
        expect(finalized.outcome).toBe('finalized');
    });

    it('fences a reused claimant string with a stale generation', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const key = keyFor(created);

        const first = await claimRecoverableReservation({
            ...key,
            leaseOwner: 'reused-claimant',
            leaseMs: 1_000,
            now: AFTER_EXPIRY,
        });
        expect(first.outcome).toBe('claimed');
        if (first.outcome !== 'claimed') return;

        const reclaimAt = new Date(AFTER_EXPIRY.getTime() + 5_000);
        const second = await claimRecoverableReservation({
            ...key,
            leaseOwner: 'reused-claimant',
            leaseMs: 60_000,
            now: reclaimAt,
        });
        expect(second.outcome).toBe('claimed');
        if (second.outcome !== 'claimed') return;

        const staleAbandon = await abandonRecoveredReservation({
            ...key,
            generation: first.reservation.generation,
            leaseOwner: 'reused-claimant',
            now: reclaimAt,
        });
        expect(staleAbandon.outcome).toBe('not_claimable');
        if (staleAbandon.outcome === 'not_claimable') {
            expect(staleAbandon.reason).toBe('stale_generation');
        }

        await expect(
            finalizeReservation({
                namespace: first.reservation.namespace,
                ownerProfileId: first.reservation.ownerProfileId,
                shareId: first.reservation.shareId,
                operationId: first.reservation.operationId,
                objectRef: first.reservation.objectRef,
                generation: first.reservation.generation,
                leaseOwner: first.reservation.leaseOwner,
                now: reclaimAt,
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });

        // The reclaimed reservation is still owned by the live generation.
        const stillOwned = await readReservationProps(created.shareId);
        expect(stillOwned?.generation).toBe(second.reservation.generation);

        const freshAbandon = await abandonRecoveredReservation({
            ...key,
            generation: second.reservation.generation,
            leaseOwner: 'reused-claimant',
            now: reclaimAt,
        });
        expect(freshAbandon.outcome).toBe('abandoned');
    });

    it('blocks recovery-worker abandonment once its lease has lapsed', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const key = keyFor(created);

        const claimed = await claimRecoverableReservation({
            ...key,
            leaseOwner: 'recovery-1',
            leaseMs: 1_000,
            now: AFTER_EXPIRY,
        });
        expect(claimed.outcome).toBe('claimed');
        if (claimed.outcome !== 'claimed') return;

        const lapsedAt = new Date(AFTER_EXPIRY.getTime() + 5_000);
        const lapsed = await abandonRecoveredReservation({
            ...key,
            generation: claimed.reservation.generation,
            leaseOwner: 'recovery-1',
            now: lapsedAt,
        });

        expect(lapsed.outcome).toBe('not_claimable');
        if (lapsed.outcome === 'not_claimable') {
            expect(lapsed.reason).toBe('lease_lapsed');
        }

        // The reservation was not destroyed by the lapsed worker.
        const stillPresent = await readReservationProps(created.shareId);
        expect(stillPresent?.leaseOwner).toBe('recovery-1');
        expect(await listCleanupJobsForShare(created.shareId)).toHaveLength(0);

        // A fresh claim renews the fence, after which a fenced abandon works.
        const reclaimed = await claimRecoverableReservation({
            ...key,
            leaseOwner: 'recovery-2',
            leaseMs: 60_000,
            now: lapsedAt,
        });
        expect(reclaimed.outcome).toBe('claimed');
        if (reclaimed.outcome !== 'claimed') return;

        const abandoned = await abandonRecoveredReservation({
            ...key,
            generation: reclaimed.reservation.generation,
            leaseOwner: 'recovery-2',
            now: lapsedAt,
        });
        expect(abandoned.outcome).toBe('abandoned');
        expect(await listCleanupJobsForShare(created.shareId)).toHaveLength(1);
    });

    it('returns absent for a wrong namespace, owner or operation with no state change', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const key = keyFor(created);
        const before = await readReservationProps(created.shareId);

        expect(
            (await readShareLinkRecoveryTarget({ ...key, namespace: OTHER_NAMESPACE })).state
        ).toBe('absent');
        expect(
            (await readShareLinkRecoveryTarget({ ...key, ownerProfileId: 'other-owner' })).state
        ).toBe('absent');
        expect((await readShareLinkRecoveryTarget({ ...key, operationId: uuid() })).state).toBe(
            'absent'
        );

        expect(
            await claimRecoverableReservation({
                ...key,
                namespace: OTHER_NAMESPACE,
                leaseOwner: 'recovery-1',
                now: AFTER_EXPIRY,
            })
        ).toEqual({ outcome: 'not_claimable', reason: 'absent' });
        expect(
            await claimRecoverableReservation({
                ...key,
                ownerProfileId: 'other-owner',
                leaseOwner: 'recovery-1',
                now: AFTER_EXPIRY,
            })
        ).toEqual({ outcome: 'not_claimable', reason: 'absent' });
        expect(
            await claimRecoverableReservation({
                ...key,
                operationId: uuid(),
                leaseOwner: 'recovery-1',
                now: AFTER_EXPIRY,
            })
        ).toEqual({ outcome: 'not_claimable', reason: 'binding_mismatch' });

        expect(await readReservationProps(created.shareId)).toEqual(before);
    });

    it('fails closed on a malformed persisted reservation binding', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const key = keyFor(created);

        await neogma.queryRunner.run(
            'MATCH (r:ShareLinkReservation {shareId: $shareId}) REMOVE r.generation',
            { shareId: created.shareId }
        );

        const discovery = await discoverRecoverableReservations({
            namespace: NAMESPACE,
            now: AFTER_EXPIRY,
        });
        expect(discovery.keys).toHaveLength(0);

        expect(
            await claimRecoverableReservation({
                ...key,
                leaseOwner: 'recovery-1',
                leaseMs: 60_000,
                now: AFTER_EXPIRY,
            })
        ).toEqual({ outcome: 'not_claimable', reason: 'malformed_binding' });

        expect(await readReservationProps(created.shareId)).not.toHaveProperty('generation');
        expect(await listCleanupJobsForShare(created.shareId)).toHaveLength(0);
        expect((await getShareLink({ shareId: created.shareId }))?.generation).toBe(
            created.generation
        );
    });

    it('recovers a metadata-only restart without changing the visible object tuple', async () => {
        const committed = await commitNewShare();
        const replacement = await reserveReplacement({
            namespace: committed.namespace,
            ownerProfileId: committed.ownerProfileId,
            clientRequestId: uuid(),
            shareId: committed.shareId,
            expectedVersion: committed.committed.version,
            requestHash: computeShareLinkRequestHash('update', {
                id: committed.shareId,
                title: 'Renamed share',
            }),
            leaseOwner: 'worker-2',
            leaseMs: 1_000,
            now: BASE,
            title: 'Renamed share',
        });
        if (replacement.outcome !== 'reserved') throw new Error('expected reserved update');

        const key: ShareLinkRecoveryKey = {
            namespace: replacement.reservation.namespace,
            ownerProfileId: replacement.reservation.ownerProfileId,
            shareId: replacement.reservation.shareId,
            operationId: replacement.reservation.operationId,
        };

        const claimed = await claimRecoverableReservation({
            ...key,
            leaseOwner: 'recovery-1',
            leaseMs: 60_000,
            now: AFTER_EXPIRY,
        });
        expect(claimed.outcome).toBe('claimed');
        if (claimed.outcome !== 'claimed') return;

        expect(claimed.reservation.objectRef).toBeNull();
        expect(claimed.reservation.contentVersion).toBeNull();

        const finalized = await finalizeReservation({
            namespace: claimed.reservation.namespace,
            ownerProfileId: claimed.reservation.ownerProfileId,
            shareId: claimed.reservation.shareId,
            operationId: claimed.reservation.operationId,
            objectRef: null,
            generation: claimed.reservation.generation,
            leaseOwner: claimed.reservation.leaseOwner,
            now: AFTER_EXPIRY,
        });

        expect(finalized.outcome).toBe('finalized');
        if (finalized.outcome !== 'finalized') return;
        expect(finalized.share.title).toBe('Renamed share');
        expect(finalized.share.activeObjectRef).toBe(committed.objectRef);
        expect(finalized.share.activeObjectOperationId).toBe(committed.operationId);
        expect(finalized.share.contentVersion).toBe(1);
    });

    it('does not resurrect work after a concurrent revoke', async () => {
        const committed = await commitNewShare();
        const replacement = await reserveReplacementContent({
            created: committed,
            seed: 'revoked-replacement',
            contentVersion: 2,
            leaseMs: 1_000,
        });

        await revokeShareLink({
            namespace: committed.namespace,
            ownerProfileId: committed.ownerProfileId,
            shareId: committed.shareId,
            now: AFTER_EXPIRY,
        });

        const replacementKey: ShareLinkRecoveryKey = {
            namespace: committed.namespace,
            ownerProfileId: committed.ownerProfileId,
            shareId: committed.shareId,
            operationId: replacement.reservation.operationId,
        };

        const discovery = await discoverRecoverableReservations({
            namespace: NAMESPACE,
            now: AFTER_EXPIRY,
        });
        expect(discovery.keys).toHaveLength(0);
        expect((await readShareLinkRecoveryTarget(replacementKey)).state).toBe('absent');

        const claim = await claimRecoverableReservation({
            ...replacementKey,
            leaseOwner: 'recovery-1',
            leaseMs: 60_000,
            now: AFTER_EXPIRY,
        });
        expect(claim.outcome).toBe('not_claimable');
        if (claim.outcome === 'not_claimable') {
            expect(claim.reason).toBe('absent');
        }

        const share = await getShareLink({ shareId: committed.shareId });
        expect(share?.status).toBe('stopped');
        expect(share?.activeObjectRef).toBe(committed.objectRef);

        const jobs = await listCleanupJobsForShare(committed.shareId);
        const refs = jobs.map(job => job.objectRef);
        expect(refs).toContain(committed.objectRef);
        expect(refs).toContain(replacement.reservation.objectRef);
    });

    it('allocates a fresh object when the abandoned request is driven again', async () => {
        const created = await reserveNewShare({ leaseMs: 1_000 });
        const key = keyFor(created);

        const claimed = await claimRecoverableReservation({
            ...key,
            leaseOwner: 'recovery-1',
            leaseMs: 60_000,
            now: AFTER_EXPIRY,
        });
        expect(claimed.outcome).toBe('claimed');
        if (claimed.outcome !== 'claimed') return;

        const abandoned = await abandonRecoveredReservation({
            ...key,
            generation: claimed.reservation.generation,
            leaseOwner: 'recovery-1',
            now: AFTER_EXPIRY,
        });
        expect(abandoned.outcome).toBe('abandoned');

        const replayed = await reserveCreate({
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
            leaseOwner: 'worker-1',
            leaseMs: 60_000,
            now: new Date(AFTER_EXPIRY.getTime() + 1_000),
        });

        expect(replayed.outcome).toBe('reserved');
        if (replayed.outcome !== 'reserved' || !replayed.reservation.objectRef) return;
        expect(replayed.reservation.objectRef).not.toBe(created.objectRef);
        expect(replayed.reservation.operationId).not.toBe(created.operationId);

        const jobs = await listCleanupJobsForShare(created.shareId);
        expect(jobs.map(job => job.objectRef)).toContain(created.objectRef);
    });
});
