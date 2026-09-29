import { randomBytes, createHash } from 'node:crypto';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { v4 as uuid } from 'uuid';

import {
    computeShareLinkPayloadHash,
    computeShareLinkRequestHash,
} from '@helpers/share-link-lifecycle';
import {
    createShareLinkCoordinator,
    runShareContentCleanupOnce,
} from '@helpers/share-link-coordinator';
import type { ShareLinkLifecycleRepository } from '@helpers/share-link-coordinator';
import { neogma } from '@instance';

import {
    abandonReservation,
    claimCleanupJobs,
    completeCleanupJob,
    finalizeReservation,
    getCurrentShareContent,
    getCleanupJob,
    getShareLink,
    listCleanupJobsForShare,
    reserveCreate,
    reserveReplacement,
    revokeShareLink,
} from '../src/accesslayer/share-link';
import type {
    ShareContentClient,
    ShareContentPutRequest,
} from '../src/helpers/share-content-client';
import { ensureShareLinkConstraints } from '../src/models/share-link-constraints';

/**
 * LC-2187 coordinator orchestration against a REAL Neo4j C3 repository with a
 * deterministic in-memory LearnCloud stand-in. The Neo4j lock/fence/cleanup
 * semantics are real; the remote object store is explicitly a fake, so this is
 * NOT the reviewed C4 HTTP endpoint integration.
 */

import { clearLifecycleGraph } from './helpers/share-link-fixtures';

const NAMESPACE = 'test-namespace';
const OWNER = 'owner-1';
const LEASE_OWNER = 'coordinator-1';

const envelopeFor = (seed: string) => ({
    v: 1 as const,
    alg: 'A256GCM' as const,
    iv: createHash('sha256').update(`iv:${seed}`).digest().subarray(0, 12).toString('base64url'),
    ct: createHash('sha256').update(`ct:${seed}`).digest().toString('base64url'),
});

const recoveryFor = (seed: string) => ({
    protected: Buffer.from(`protected:${seed}`).toString('base64url'),
    iv: Buffer.from(`iv:${seed}`).toString('base64url'),
    ciphertext: Buffer.from(`ciphertext:${seed}`).toString('base64url'),
    tag: Buffer.from(`tag:${seed}`).toString('base64url'),
});

type StoredObject = ShareContentPutRequest & {
    payloadHash: string;
    contentHash: string;
    ciphertextBytes: number;
    recoveryBytes: number;
    deleted: boolean;
};

const createFakeLearnCloud = (options?: {
    statPayloadHashOverride?: string;
    deleteErrorOnce?: 'UNAVAILABLE';
}) => {
    const objects = new Map<string, StoredObject>();
    const puts: ShareContentPutRequest[] = [];
    const deletes: Array<{ objectId: string; operationId: string; contentVersion: number }> = [];
    let failNextDelete = options?.deleteErrorOnce === 'UNAVAILABLE';

    const summary = (object: StoredObject) => ({
        kind: 'active' as const,
        namespace: object.namespace,
        ownerProfileId: object.ownerProfileId,
        shareId: object.shareId,
        contentVersion: object.contentVersion,
        objectId: object.objectId,
        operationId: object.operationId,
        contentHash: object.contentHash,
        payloadHash: options?.statPayloadHashOverride ?? object.payloadHash,
        ciphertextBytes: object.ciphertextBytes,
        recoveryBytes: object.recoveryBytes,
        createdAt: '2026-09-20T00:00:00.000Z',
    });

    const client = {
        put: vi.fn(async (request: ShareContentPutRequest) => {
            const payloadHash = computeShareLinkPayloadHash({
                envelope: request.envelope,
                ownerEncryptedRecovery: request.ownerEncryptedRecovery,
            });
            const object: StoredObject = {
                ...request,
                payloadHash,
                contentHash: createHash('sha256')
                    .update(`${request.objectId}:${payloadHash}`)
                    .digest('hex'),
                ciphertextBytes: Buffer.from(request.envelope.ct, 'base64url').length,
                recoveryBytes: Buffer.byteLength(
                    JSON.stringify(request.ownerEncryptedRecovery),
                    'utf8'
                ),
                deleted: false,
            };
            objects.set(request.objectId, object);
            puts.push(request);

            return {
                ok: true as const,
                value: { status: 'created' as const, record: summary(object) },
            };
        }),
        stat: vi.fn(async (request: { objectId: string }) => {
            const object = objects.get(request.objectId);

            if (!object) return { ok: false as const, error: 'NOT_FOUND' as const };

            if (object.deleted) {
                return {
                    ok: true as const,
                    value: {
                        kind: 'tombstone' as const,
                        namespace: object.namespace,
                        ownerProfileId: object.ownerProfileId,
                        shareId: object.shareId,
                        contentVersion: object.contentVersion,
                        objectId: object.objectId,
                        operationId: object.operationId,
                        deletedAt: '2026-09-20T00:00:00.000Z',
                    },
                };
            }

            return { ok: true as const, value: summary(object) };
        }),
        delete: vi.fn(
            async (request: { objectId: string; operationId: string; contentVersion: number }) => {
                deletes.push({
                    objectId: request.objectId,
                    operationId: request.operationId,
                    contentVersion: request.contentVersion,
                });

                if (failNextDelete) {
                    failNextDelete = false;

                    return { ok: false as const, error: 'UNAVAILABLE' as const };
                }

                const object = objects.get(request.objectId);

                if (object) object.deleted = true;

                return {
                    ok: true as const,
                    value: {
                        kind: 'tombstone' as const,
                        namespace: NAMESPACE,
                        ownerProfileId: OWNER,
                        shareId: object?.shareId ?? '',
                        contentVersion: request.contentVersion,
                        objectId: request.objectId,
                        operationId: request.operationId,
                        deletedAt: '2026-09-20T00:00:00.000Z',
                    },
                };
            }
        ),
        get: vi.fn(),
        readRecovery: vi.fn(),
    };

    return {
        client: client as unknown as ShareContentClient,
        objects,
        puts,
        deletes,
        raw: client,
    };
};

const repository: ShareLinkLifecycleRepository = {
    reserveCreate,
    reserveReplacement,
    finalizeReservation,
    abandonReservation,
    revokeShareLink,
    getShareLink,
    getCurrentShareContent,
    claimCleanupJobs,
    completeCleanupJob,
};

const makeCreateRequest = (overrides: Record<string, unknown> = {}) => ({
    id: randomBytes(16).toString('base64url'),
    clientRequestId: uuid(),
    title: 'Shared credentials',
    selectedCount: 1,
    contentVersion: 1,
    envelope: envelopeFor('create'),
    ownerEncryptedRecovery: recoveryFor('create'),
    ...overrides,
});

const makeCoordinator = (
    client: ShareContentClient,
    repo: ShareLinkLifecycleRepository = repository,
    now?: () => Date
) =>
    createShareLinkCoordinator({
        repository: repo,
        client,
        leaseOwner: LEASE_OWNER,
        leaseMs: 60_000,
        now: now ?? (() => new Date()),
    });

const context = { namespace: NAMESPACE, ownerProfileId: OWNER };

describe('share-link coordinator (real Neo4j, fake LearnCloud)', () => {
    beforeAll(async () => {
        await ensureShareLinkConstraints();
    });

    beforeEach(async () => {
        await clearLifecycleGraph();
    });

    afterAll(async () => {
        await clearLifecycleGraph();
    });

    it('creates a share: reserve, upload reserved ids, verify stat and finalize', async () => {
        const learnCloud = createFakeLearnCloud();
        const coordinator = makeCoordinator(learnCloud.client);
        const request = makeCreateRequest();

        const result = await coordinator.createShareLink(request, context);

        expect(result.status).toBe('committed');
        expect(learnCloud.raw.put).toHaveBeenCalledTimes(1);

        const put = learnCloud.puts[0];
        expect(put?.contentVersion).toBe(1);

        const share = await getShareLink({ shareId: request.id });
        expect(share?.status).toBe('active');
        expect(share?.contentState).toBe('finalized');
        expect(share?.activeObjectRef).toBe(put?.objectId);
        expect(share?.activeObjectOperationId).toBe(put?.operationId);
        expect(share?.activeContentHash).toBe(
            computeShareLinkPayloadHash({
                envelope: request.envelope,
                ownerEncryptedRecovery: request.ownerEncryptedRecovery,
            })
        );
    });

    it('replays a committed create without a second upload', async () => {
        const learnCloud = createFakeLearnCloud();
        const coordinator = makeCoordinator(learnCloud.client);
        const request = makeCreateRequest();

        expect((await coordinator.createShareLink(request, context)).status).toBe('committed');
        const replay = await coordinator.createShareLink(request, context);

        expect(replay.status).toBe('replayed');
        expect(learnCloud.raw.put).toHaveBeenCalledTimes(1);
    });

    it('queues the superseded object for cleanup on a content update', async () => {
        const learnCloud = createFakeLearnCloud();
        const coordinator = makeCoordinator(learnCloud.client);
        const created = makeCreateRequest();
        const first = await coordinator.createShareLink(created, context);
        if (first.status !== 'committed') throw new Error('expected committed create');

        const update = await coordinator.updateShareLink(
            {
                id: created.id,
                expectedVersion: first.share.version,
                clientRequestId: uuid(),
                contentVersion: 2,
                selectedCount: 1,
                envelope: envelopeFor('update'),
                ownerEncryptedRecovery: recoveryFor('update'),
            },
            context
        );

        expect(update.status).toBe('committed');
        if (update.status !== 'committed') return;

        expect(update.share.contentVersion).toBe(2);
        expect(update.share.activeObjectRef).not.toBe(first.share.activeObjectRef);

        const jobs = await listCleanupJobsForShare(created.id);
        const superseded = jobs.find(job => job.objectRef === first.share.activeObjectRef);
        expect(superseded).toMatchObject({
            reason: 'superseded',
            operationId: first.share.activeObjectOperationId,
        });
    });

    it('metadata-only update uploads nothing and preserves the original object operation id', async () => {
        const learnCloud = createFakeLearnCloud();
        const coordinator = makeCoordinator(learnCloud.client);
        const created = makeCreateRequest();
        const first = await coordinator.createShareLink(created, context);
        if (first.status !== 'committed') throw new Error('expected committed create');

        const updated = await coordinator.updateShareLink(
            {
                id: created.id,
                expectedVersion: first.share.version,
                clientRequestId: uuid(),
                title: 'Renamed share',
            },
            context
        );

        expect(updated.status).toBe('committed');
        expect(learnCloud.raw.put).toHaveBeenCalledTimes(1);

        const share = await getShareLink({ shareId: created.id });
        expect(share?.activeObjectRef).toBe(first.share.activeObjectRef);
        expect(share?.activeObjectOperationId).toBe(first.share.activeObjectOperationId);
        expect(share?.title).toBe('Renamed share');

        const content = await getCurrentShareContent({ shareId: created.id });
        expect(content.state === 'active' && content.operationId).toBe(
            first.share.activeObjectOperationId
        );

        // Only the latest metadata operation id advanced; the object binding did not.
        expect(share?.lastOperationId).not.toBe(first.share.activeObjectOperationId);
    });

    it('keeps a failed finalize resumable and commits the already-uploaded object later', async () => {
        const learnCloud = createFakeLearnCloud();
        const failingRepository: ShareLinkLifecycleRepository = {
            ...repository,
            finalizeReservation: vi
                .fn()
                .mockRejectedValueOnce(new Error('neo4j unavailable'))
                .mockImplementation(finalizeReservation),
        };
        const coordinator = makeCoordinator(learnCloud.client, failingRepository);
        const request = makeCreateRequest();

        const first = await coordinator.createShareLink(request, context);

        expect(first.status).toBe('pending');
        if (first.status !== 'pending') return;
        expect(first.reason).toBe('finalize_unavailable');
        expect(learnCloud.raw.put).toHaveBeenCalledTimes(1);

        const beforeResume = await getShareLink({ shareId: request.id });
        expect(beforeResume?.contentState).toBe('staging');

        const retryCoordinator = makeCoordinator(learnCloud.client, repository);
        const resumed = await retryCoordinator.resumePendingOperation({
            reservation: first.reservation,
        });

        expect(resumed.status).toBe('committed');
        expect(learnCloud.raw.put).toHaveBeenCalledTimes(1);

        const share = await getShareLink({ shareId: request.id });
        expect(share?.contentState).toBe('finalized');
        expect(share?.activeObjectRef).toBe(learnCloud.puts[0]?.objectId);
    });

    it('never finalizes on a wrong stat hash and does not destroy the staged object', async () => {
        const learnCloud = createFakeLearnCloud({ statPayloadHashOverride: 'e'.repeat(64) });
        const coordinator = makeCoordinator(learnCloud.client);
        const request = makeCreateRequest();

        const result = await coordinator.createShareLink(request, context);

        expect(result.status).toBe('pending');
        if (result.status === 'pending') expect(result.reason).toBe('stat_mismatch');

        const share = await getShareLink({ shareId: request.id });
        expect(share?.contentState).toBe('staging');
        expect(share?.activeObjectRef).toBeNull();
        expect(await listCleanupJobsForShare(request.id)).toHaveLength(0);
    });

    it('revokes synchronously and queues cleanup without any LearnCloud delete', async () => {
        const learnCloud = createFakeLearnCloud();
        const coordinator = makeCoordinator(learnCloud.client);
        const created = makeCreateRequest();
        const first = await coordinator.createShareLink(created, context);
        if (first.status !== 'committed') throw new Error('expected committed create');

        const revoked = await coordinator.revokeShareLink(
            { id: created.id, clientRequestId: uuid() },
            context
        );

        expect(revoked.status).toBe('revoked');
        expect(revoked.share.status).toBe('stopped');
        expect(learnCloud.raw.delete).not.toHaveBeenCalled();

        const jobs = await listCleanupJobsForShare(created.id);
        const stopped = jobs.find(job => job.objectRef === first.share.activeObjectRef);
        expect(stopped).toMatchObject({
            reason: 'stopped',
            operationId: first.share.activeObjectOperationId,
        });
    });

    it('runs a bounded cleanup with retry and preserves original object identity after metadata', async () => {
        const learnCloud = createFakeLearnCloud({ deleteErrorOnce: 'UNAVAILABLE' });
        const coordinator = makeCoordinator(learnCloud.client);
        const created = makeCreateRequest();
        const first = await coordinator.createShareLink(created, context);
        if (first.status !== 'committed') throw new Error('expected committed create');

        // Metadata-only update: the visible object operation id must not change.
        const updated = await coordinator.updateShareLink(
            {
                id: created.id,
                expectedVersion: first.share.version,
                clientRequestId: uuid(),
                note: 'updated note',
            },
            context
        );
        expect(updated.status).toBe('committed');

        await coordinator.revokeShareLink({ id: created.id, clientRequestId: uuid() }, context);

        const base = Date.now();
        const firstRun = await runShareContentCleanupOnce({
            repository,
            client: learnCloud.client,
            claimant: 'cleaner-1',
            namespace: NAMESPACE,
            now: () => new Date(base),
        });

        expect(firstRun).toMatchObject({ claimed: 1, completed: 0, retried: 1 });
        expect(learnCloud.deletes[0]).toMatchObject({
            objectId: first.share.activeObjectRef,
            operationId: first.share.activeObjectOperationId,
        });

        const queued = await getCleanupJob(first.share.activeObjectRef as string);
        expect(queued?.status).toBe('queued');

        const secondRun = await runShareContentCleanupOnce({
            repository,
            client: learnCloud.client,
            claimant: 'cleaner-2',
            namespace: NAMESPACE,
            now: () => new Date(Date.parse(queued!.nextAttemptAt) + 1000),
        });

        expect(secondRun).toMatchObject({ claimed: 1, completed: 1 });
        expect(learnCloud.deletes).toHaveLength(2);
        expect(learnCloud.deletes[1]).toMatchObject({
            objectId: first.share.activeObjectRef,
            operationId: first.share.activeObjectOperationId,
        });
        expect((await getCleanupJob(first.share.activeObjectRef as string))?.status).toBe(
            'completed'
        );
    });

    it('fences a stale worker after revoke and never finalizes it', async () => {
        const learnCloud = createFakeLearnCloud();
        const coordinator = makeCoordinator(learnCloud.client);
        const created = makeCreateRequest();
        const first = await coordinator.createShareLink(created, context);
        if (first.status !== 'committed') throw new Error('expected committed create');

        // Stage an in-flight replacement but never drive it.
        const staged = await reserveReplacement({
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            clientRequestId: uuid(),
            shareId: created.id,
            expectedVersion: first.share.version,
            requestHash: createHash('sha256').update('stale').digest('hex'),
            leaseOwner: 'stale-worker',
            now: new Date(),
            content: {
                contentHash: createHash('sha256').update('stale-content').digest('hex'),
                contentBytes: 32,
                recoveryHash: createHash('sha256').update('stale-recovery').digest('hex'),
                recoveryBytes: 20,
                contentVersion: 2,
                selectedCount: 1,
            },
        });
        expect(staged.outcome).toBe('reserved');
        if (staged.outcome !== 'reserved' || !staged.reservation.objectRef) return;

        await revokeShareLink({
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId: created.id,
            now: new Date(),
        });

        await expect(
            finalizeReservation({
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId: created.id,
                operationId: staged.reservation.operationId,
                objectRef: staged.reservation.objectRef,
                generation: staged.reservation.generation,
                leaseOwner: staged.reservation.leaseOwner,
                now: new Date(),
            })
        ).rejects.toMatchObject({ code: 'CONFLICT' });

        const share = await getShareLink({ shareId: created.id });
        expect(share?.status).toBe('stopped');
        expect(share?.activeObjectRef).toBe(first.share.activeObjectRef);
    });

    it.each([false, true])(
        'retains original expiry across create retry (already abandoned: %s)',
        async alreadyAbandoned => {
            const learnCloud = createFakeLearnCloud();
            let failFirstPut = true;
            const client = {
                ...learnCloud.client,
                put: vi.fn(async (request: Parameters<ShareContentClient['put']>[0]) => {
                    if (failFirstPut) {
                        failFirstPut = false;

                        return { ok: false as const, error: 'UNAVAILABLE' as const };
                    }

                    return learnCloud.client.put(request);
                }),
            } as unknown as ShareContentClient;

            const t0 = new Date('2026-09-21T00:00:00.000Z');
            let clock = t0;
            const coordinator = createShareLinkCoordinator({
                repository,
                client,
                leaseOwner: LEASE_OWNER,
                leaseMs: 1_000,
                now: () => clock,
                policyResolver: {
                    resolve: async () => ({
                        isMinor: false,
                        policyResolved: true,
                        defaultExpiryDays: 365 as const,
                        viewCountingEnabled: true,
                    }),
                },
            });
            const request = makeCreateRequest();

            // First attempt stays pending on a transient upload failure.
            const pending = await coordinator.createShareLink(request, context);
            expect(pending.status).toBe('pending');
            if (alreadyAbandoned && pending.status === 'pending') {
                await coordinator.abandonPendingOperation({ reservation: pending.reservation });
            }

            // Clock advances past the 1s lease; the same logical create is retried
            // with a server-derived default that would otherwise be `t0 + 5s + 365d`.
            clock = new Date(t0.getTime() + 5_000);
            const retry = await coordinator.createShareLink(request, context);
            expect(retry.status).toBe('committed');

            const share = await getShareLink({ shareId: request.id });
            expect(share?.expiresAt).toBe('2027-09-21T00:00:00.000Z');

            // The abandoned first upload is queued for cleanup and a fresh immutable
            // object identity was allocated for the replacement.
            const jobs = await listCleanupJobsForShare(request.id);
            expect(jobs.some(job => job.reason === 'abandoned')).toBe(true);
            expect(learnCloud.puts).toHaveLength(1);
        }
    );

    it('admits retained expired content only to owner recovery while the public guard stays denied', async () => {
        const learnCloud = createFakeLearnCloud();
        const coordinator = makeCoordinator(learnCloud.client);
        const request = makeCreateRequest({ expiresAt: '2020-01-01T00:00:00.000Z' });

        expect((await coordinator.createShareLink(request, context)).status).toBe('committed');

        learnCloud.raw.readRecovery.mockResolvedValueOnce({
            ok: true as const,
            value: { ownerEncryptedRecovery: recoveryFor('owner-expired') },
        });

        const owner = await coordinator.readOwnerRecovery(request.id, context);
        expect(owner.ok).toBe(true);

        const publicRead = await coordinator.fetchShareContent(request.id, context);
        expect(publicRead.ok).toBe(false);
        if (!publicRead.ok) expect(publicRead.error).toBe('NOT_FOUND');

        const activeRead = await coordinator.getActiveShareContent(request.id, context);
        expect(activeRead.state).toBe('not_active');
        if (activeRead.state === 'not_active') expect(activeRead.reason).toBe('expired');
    });

    it('withholds owner recovery when a revoke lands during the remote read', async () => {
        const learnCloud = createFakeLearnCloud();
        const coordinator = makeCoordinator(learnCloud.client);
        const request = makeCreateRequest();

        expect((await coordinator.createShareLink(request, context)).status).toBe('committed');

        learnCloud.raw.readRecovery.mockImplementationOnce(async () => {
            await revokeShareLink({
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId: request.id,
                now: new Date(),
            });

            return {
                ok: true as const,
                value: { ownerEncryptedRecovery: recoveryFor('revoked-during-read') },
            };
        });

        const owner = await coordinator.readOwnerRecovery(request.id, context);
        expect(owner.ok).toBe(false);
    });

    it('withholds owner recovery when a replacement commits during the remote read', async () => {
        const learnCloud = createFakeLearnCloud();
        const coordinator = makeCoordinator(learnCloud.client);
        const request = makeCreateRequest();

        const created = await coordinator.createShareLink(request, context);
        if (created.status !== 'committed') throw new Error('expected committed create');

        learnCloud.raw.readRecovery.mockImplementationOnce(async () => {
            const share = await getShareLink({ shareId: request.id });
            if (!share) throw new Error('expected share');

            const replacement = await reserveReplacement({
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                clientRequestId: uuid(),
                shareId: request.id,
                expectedVersion: share.version,
                requestHash: computeShareLinkRequestHash('update', {
                    id: request.id,
                    title: 'Metadata only',
                }),
                title: 'Metadata only',
                leaseOwner: 'worker-2',
                now: new Date(),
            });
            if (replacement.outcome !== 'reserved') throw new Error('expected reservation');

            await finalizeReservation({ ...replacement.reservation, now: new Date() });

            return {
                ok: true as const,
                value: { ownerEncryptedRecovery: recoveryFor('replaced-during-read') },
            };
        });

        const owner = await coordinator.readOwnerRecovery(request.id, context);
        expect(owner.ok).toBe(false);
    });
});
