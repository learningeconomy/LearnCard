import { describe, expect, it, vi } from 'vitest';

import {
    SHARE_LINK_RECOVERY_DEFAULT_BATCH,
    SHARE_LINK_RECOVERY_MAX_BATCH,
    clampShareLinkRecoveryBatch,
    classifyOperationBinding,
    classifyReservationBinding,
    computeShareLinkPayloadHash,
} from '@helpers/share-link-lifecycle';
import {
    recoverShareLinkOperation,
    runShareLinkRecoveryOnce,
} from '@helpers/share-link-coordinator';
import type {
    RecoveryRunnerDependencies,
    ShareLinkRecoveryRepository,
} from '@helpers/share-link-coordinator';

import type { ShareContentClient } from '../src/helpers/share-content-client';
import type {
    ShareLinkOperationKind,
    ShareLinkReservationRecord,
} from '../src/accesslayer/share-link';
import type { ShareLinkRecord } from '../src/models/ShareLink';

const NAMESPACE = 'test-namespace';
const OWNER = 'owner-1';
const SHARE_ID = Buffer.alloc(16, 1).toString('base64url');
const OBJECT_REF = 'o'.repeat(43);
const OPERATION_ID = '11111111-1111-4111-8111-111111111111';
const CLIENT_REQUEST_ID = '22222222-2222-4222-8222-222222222222';

const envelope = {
    v: 1 as const,
    alg: 'A256GCM' as const,
    iv: Buffer.alloc(12, 2).toString('base64url'),
    ct: Buffer.alloc(32, 3).toString('base64url'),
};

const recovery = { protected: 'a', iv: 'b', ciphertext: 'c', tag: 'd' };

const payloadHash = computeShareLinkPayloadHash({
    envelope,
    ownerEncryptedRecovery: recovery,
});

const makeShare = (overrides: Partial<ShareLinkRecord> = {}): ShareLinkRecord => ({
    id: SHARE_ID,
    namespace: NAMESPACE,
    ownerProfileId: OWNER,
    version: 1,
    contentVersion: 1,
    generation: 1,
    status: 'pending',
    contentState: 'staging',
    activeObjectRef: null,
    activeObjectOperationId: null,
    activeContentHash: null,
    activeContentBytes: null,
    activeRecoveryHash: null,
    lastOperationId: null,
    createdByClientRequestId: null,
    title: 'Shared credentials',
    note: null,
    selectedCount: 1,
    expiresAt: null,
    stoppedAt: null,
    viewCount: 0,
    lastViewedAt: null,
    minorPolicyIsMinor: null,
    minorPolicyResolved: false,
    minorPolicyDefaultExpiryDays: 30,
    minorPolicyViewCountingEnabled: false,
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
});

const makeReservation = (
    overrides: Partial<ShareLinkReservationRecord> = {}
): ShareLinkReservationRecord => ({
    shareId: SHARE_ID,
    namespace: NAMESPACE,
    ownerProfileId: OWNER,
    opKind: 'create' as ShareLinkOperationKind,
    clientRequestId: CLIENT_REQUEST_ID,
    requestHash: 'r'.repeat(64),
    operationId: OPERATION_ID,
    objectRef: OBJECT_REF,
    contentVersion: 1,
    baseVersion: 1,
    baseContentVersion: 1,
    contentHash: payloadHash,
    contentBytes: 32,
    recoveryHash: 'c'.repeat(64),
    recoveryBytes: 12,
    title: 'Shared credentials',
    note: null,
    expiresAt: null,
    selectedCount: 1,
    generation: 1,
    leaseOwner: 'recovery-1',
    leaseExpiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
});

const activeStat = (overrides: Record<string, unknown> = {}) => ({
    kind: 'active' as const,
    namespace: NAMESPACE,
    ownerProfileId: OWNER,
    shareId: SHARE_ID,
    contentVersion: 1,
    objectId: OBJECT_REF,
    operationId: OPERATION_ID,
    contentHash: 'd'.repeat(64),
    payloadHash,
    ciphertextBytes: 32,
    recoveryBytes: 12,
    createdAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
});

const tombstoneStat = () => ({
    kind: 'tombstone' as const,
    namespace: NAMESPACE,
    ownerProfileId: OWNER,
    shareId: SHARE_ID,
    contentVersion: 1,
    objectId: OBJECT_REF,
    operationId: OPERATION_ID,
    deletedAt: '2026-09-20T00:00:00.000Z',
});

const recoveryKey = () => ({
    namespace: NAMESPACE,
    ownerProfileId: OWNER,
    shareId: SHARE_ID,
    operationId: OPERATION_ID,
});

const makeRecoveryRepository = (
    overrides: Partial<ShareLinkRecoveryRepository> = {}
): ShareLinkRecoveryRepository =>
    ({
        discoverRecoverableReservations: vi.fn(async () => ({ keys: [] })),
        readShareLinkRecoveryTarget: vi.fn(async () => ({ state: 'absent' })),
        claimRecoverableReservation: vi.fn(async () => ({
            outcome: 'claimed',
            share: makeShare(),
            reservation: makeReservation(),
        })),
        abandonRecoveredReservation: vi.fn(async () => ({
            outcome: 'abandoned',
            cleanupQueuedFor: OBJECT_REF,
        })),
        finalizeReservation: vi.fn(async () => ({
            outcome: 'finalized',
            share: makeShare({ status: 'active', contentState: 'finalized', version: 2 }),
            cleanupQueuedFor: null,
        })),
        ...overrides,
    }) as unknown as ShareLinkRecoveryRepository;

const makeClient = (stat: ShareContentClient['stat']) =>
    ({ stat }) as unknown as Pick<ShareContentClient, 'stat'>;

const makeDependencies = (
    repository: ShareLinkRecoveryRepository,
    stat: ShareContentClient['stat'] = vi.fn(async () => ({
        ok: true,
        value: activeStat(),
    })) as never
): RecoveryRunnerDependencies => ({
    repository,
    client: makeClient(stat),
    claimant: 'recovery-1',
    namespace: NAMESPACE,
    leaseMs: 60_000,
    now: () => new Date('2026-09-20T00:00:00.000Z'),
});

describe('share-link recovery batch bounds and binding helpers', () => {
    it('bounds the discovery batch to the documented 1..100 cap', () => {
        expect(SHARE_LINK_RECOVERY_DEFAULT_BATCH).toBe(25);
        expect(SHARE_LINK_RECOVERY_MAX_BATCH).toBe(100);
        expect(clampShareLinkRecoveryBatch(undefined)).toBe(25);
        expect(clampShareLinkRecoveryBatch(0)).toBe(25);
        expect(clampShareLinkRecoveryBatch(-3)).toBe(25);
        expect(clampShareLinkRecoveryBatch(1)).toBe(1);
        expect(clampShareLinkRecoveryBatch(50)).toBe(50);
        expect(clampShareLinkRecoveryBatch(100)).toBe(100);
        expect(clampShareLinkRecoveryBatch(101)).toBe(100);
        expect(clampShareLinkRecoveryBatch(10_000)).toBe(100);
    });

    it('accepts a well-formed content reservation binding', () => {
        expect(
            classifyReservationBinding(
                {
                    shareId: SHARE_ID,
                    namespace: NAMESPACE,
                    ownerProfileId: OWNER,
                    operationId: OPERATION_ID,
                    opKind: 'create',
                    clientRequestId: CLIENT_REQUEST_ID,
                    generation: 3,
                    baseVersion: 2,
                    baseContentVersion: 1,
                    leaseOwner: 'worker-1',
                    leaseExpiresAt: '2099-01-01T00:00:00.000Z',
                    objectRef: OBJECT_REF,
                    contentVersion: 2,
                    contentHash: payloadHash,
                    contentBytes: 32,
                    recoveryHash: 'c'.repeat(64),
                    recoveryBytes: 12,
                },
                recoveryKey()
            )
        ).toBe('ok');
    });

    it('accepts a well-formed metadata-only reservation binding', () => {
        expect(
            classifyReservationBinding(
                {
                    shareId: SHARE_ID,
                    namespace: NAMESPACE,
                    ownerProfileId: OWNER,
                    operationId: OPERATION_ID,
                    opKind: 'update',
                    clientRequestId: CLIENT_REQUEST_ID,
                    generation: 3,
                    baseVersion: 2,
                    baseContentVersion: 1,
                    leaseOwner: 'worker-1',
                    leaseExpiresAt: '2099-01-01T00:00:00.000Z',
                    objectRef: null,
                    contentVersion: null,
                    contentHash: null,
                    contentBytes: null,
                    recoveryHash: null,
                    recoveryBytes: null,
                },
                recoveryKey()
            )
        ).toBe('ok');
    });

    it('classifies a mismatched scoped key distinctly from a malformed record', () => {
        const base = {
            shareId: SHARE_ID,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            operationId: OPERATION_ID,
            opKind: 'create',
            clientRequestId: CLIENT_REQUEST_ID,
            generation: 1,
            baseVersion: 1,
            baseContentVersion: 1,
            leaseOwner: 'worker-1',
            leaseExpiresAt: '2099-01-01T00:00:00.000Z',
            objectRef: OBJECT_REF,
            contentVersion: 1,
            contentHash: payloadHash,
            contentBytes: 32,
            recoveryHash: 'c'.repeat(64),
            recoveryBytes: 12,
        };

        expect(
            classifyReservationBinding({ ...base, operationId: 'other-op' }, recoveryKey())
        ).toBe('binding_mismatch');
        expect(classifyReservationBinding({ ...base, namespace: 'other-ns' }, recoveryKey())).toBe(
            'binding_mismatch'
        );

        const { generation: _generation, ...missingGeneration } = base;
        expect(classifyReservationBinding(missingGeneration, recoveryKey())).toBe(
            'malformed_binding'
        );
        expect(
            classifyReservationBinding({ ...base, generation: 'not-a-number' }, recoveryKey())
        ).toBe('malformed_binding');
        expect(classifyReservationBinding({ ...base, opKind: 'delete' }, recoveryKey())).toBe(
            'malformed_binding'
        );
        expect(
            classifyReservationBinding(
                { ...base, leaseExpiresAt: 'not-a-timestamp' },
                recoveryKey()
            )
        ).toBe('malformed_binding');

        // Object ref without its content version (or vice versa) is inconsistent.
        expect(classifyReservationBinding({ ...base, contentVersion: null }, recoveryKey())).toBe(
            'malformed_binding'
        );
        expect(classifyReservationBinding({ ...base, objectRef: null }, recoveryKey())).toBe(
            'malformed_binding'
        );
        // Content bindings present without an object are malformed.
        expect(
            classifyReservationBinding(
                {
                    ...base,
                    objectRef: null,
                    contentVersion: null,
                    contentHash: payloadHash,
                },
                recoveryKey()
            )
        ).toBe('malformed_binding');
        // An object without its hashes/sizes is malformed.
        expect(classifyReservationBinding({ ...base, contentHash: null }, recoveryKey())).toBe(
            'malformed_binding'
        );
    });

    it('classifies operation records against the reservation binding', () => {
        const expected = {
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId: SHARE_ID,
            operationId: OPERATION_ID,
            opKind: 'create',
            clientRequestId: CLIENT_REQUEST_ID,
        };
        const base = {
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            shareId: SHARE_ID,
            operationId: OPERATION_ID,
            opKind: 'create',
            clientRequestId: CLIENT_REQUEST_ID,
            status: 'in_progress',
        };

        expect(classifyOperationBinding(base, expected)).toBe('ok');
        expect(classifyOperationBinding({ ...base, shareId: 'other' }, expected)).toBe(
            'binding_mismatch'
        );
        expect(classifyOperationBinding({ ...base, status: 'committed' }, expected)).toBe('ok');
        expect(classifyOperationBinding({ ...base, opKind: 'update' }, expected)).toBe(
            'binding_mismatch'
        );
        expect(classifyOperationBinding({ ...base, status: 'weird' }, expected)).toBe(
            'malformed_binding'
        );
        const { status: _status, ...withoutStatus } = base;
        expect(classifyOperationBinding(withoutStatus, expected)).toBe('malformed_binding');
    });
});

describe('one-shot share-link recovery runner', () => {
    it('discovers, claims, verifies a matching stat and finalizes once', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
        });
        const stat = vi.fn(async () => ({ ok: true as const, value: activeStat() }));
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({
            discovered: 1,
            claimed: 1,
            finalized: 1,
            abandoned: 0,
            deferred: 0,
            claimLost: 0,
            anomalies: 0,
        });
        expect(summary.categories).toEqual({ finalized: 1 });
        expect(repository.finalizeReservation).toHaveBeenCalledTimes(1);
        expect(repository.abandonRecoveredReservation).not.toHaveBeenCalled();
        const finalizeArgs = (repository.finalizeReservation as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
        expect(finalizeArgs).toMatchObject({
            shareId: SHARE_ID,
            operationId: OPERATION_ID,
            objectRef: OBJECT_REF,
            generation: 1,
            leaseOwner: 'recovery-1',
        });
    });

    it('abandons a missing object under the live recovery fence', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
        });
        const stat = vi.fn(async () => ({ ok: false as const, error: 'NOT_FOUND' as const }));
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ finalized: 0, abandoned: 1, deferred: 0 });
        expect(summary.categories).toEqual({ abandoned_missing: 1 });
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
        expect(repository.abandonRecoveredReservation).toHaveBeenCalledTimes(1);
    });

    it('abandons a permanent tombstone under the live recovery fence', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
        });
        const stat = vi.fn(async () => ({ ok: true as const, value: tombstoneStat() }));
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ abandoned: 1 });
        expect(summary.categories).toEqual({ abandoned_tombstone: 1 });
        expect(repository.abandonRecoveredReservation).toHaveBeenCalledTimes(1);
    });

    it('defers a divergent active stat without destroying content', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
        });
        const stat = vi.fn(async () => ({
            ok: true as const,
            value: activeStat({ payloadHash: 'e'.repeat(64) }),
        }));
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ finalized: 0, abandoned: 0, deferred: 1 });
        expect(summary.categories).toEqual({ deferred_stat_mismatch: 1 });
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
        expect(repository.abandonRecoveredReservation).not.toHaveBeenCalled();
    });

    it('defers transient dependency failures without destroying content', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
        });
        const stat = vi.fn(async () => ({ ok: false as const, error: 'TIMEOUT' as const }));
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ deferred: 1 });
        expect(summary.categories).toEqual({ deferred_stat_transient: 1 });
        expect(repository.abandonRecoveredReservation).not.toHaveBeenCalled();
    });

    it('defers a deterministic auth/transport error without destroying content', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
        });
        const stat = vi.fn(async () => ({ ok: false as const, error: 'UNAUTHORIZED' as const }));
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ deferred: 1 });
        expect(summary.categories).toEqual({ deferred_stat_error: 1 });
        expect(repository.abandonRecoveredReservation).not.toHaveBeenCalled();
    });

    it('defers a thrown storage dependency as a bounded category without throwing', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
        });
        const stat = vi.fn(async () => {
            throw new Error('socket hang up');
        });
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ finalized: 0, abandoned: 0, deferred: 1 });
        expect(summary.categories).toEqual({ deferred_stat_error: 1 });
        expect(repository.abandonRecoveredReservation).not.toHaveBeenCalled();
    });

    it('finalizes a metadata-only reservation without any storage I/O', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
            claimRecoverableReservation: vi.fn(async () => ({
                outcome: 'claimed' as const,
                share: makeShare({ status: 'active', contentState: 'finalized', version: 2 }),
                reservation: makeReservation({
                    opKind: 'update' as ShareLinkOperationKind,
                    objectRef: null,
                    contentVersion: null,
                    contentHash: null,
                    contentBytes: null,
                    recoveryHash: null,
                    recoveryBytes: null,
                }),
            })),
        });
        const stat = vi.fn();
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ finalized: 1 });
        expect(stat).not.toHaveBeenCalled();
        const finalizeArgs = (repository.finalizeReservation as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
        expect(finalizeArgs.objectRef).toBeNull();
    });

    it('fails closed on a malformed persisted binding without acting', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
            claimRecoverableReservation: vi.fn(async () => ({
                outcome: 'not_claimable' as const,
                reason: 'malformed_binding' as const,
            })),
        });
        const stat = vi.fn();
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ claimed: 0, anomalies: 1, finalized: 0, abandoned: 0 });
        expect(summary.categories).toEqual({ malformed_binding: 1 });
        expect(stat).not.toHaveBeenCalled();
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
        expect(repository.abandonRecoveredReservation).not.toHaveBeenCalled();
    });

    it('records a lost claim without retrying it in the same pass', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
            claimRecoverableReservation: vi.fn(async () => ({
                outcome: 'not_claimable' as const,
                reason: 'lease_active' as const,
            })),
        });
        const stat = vi.fn();
        const summary = await runShareLinkRecoveryOnce(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat'])
        );

        expect(summary).toMatchObject({ discovered: 1, claimed: 0, claimLost: 1 });
        expect(summary.categories).toEqual({ claim_lost: 1 });
        expect(repository.claimRecoverableReservation).toHaveBeenCalledTimes(1);
        expect(repository.discoverRecoverableReservations).toHaveBeenCalledTimes(1);
        expect(stat).not.toHaveBeenCalled();
    });

    it('retains recoverable work when finalize fails unexpectedly', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
            finalizeReservation: vi.fn(async () => {
                throw new Error('neo4j unavailable');
            }),
        });
        const summary = await runShareLinkRecoveryOnce(makeDependencies(repository));

        expect(summary).toMatchObject({ finalized: 0, deferred: 1 });
        expect(summary.categories).toEqual({ deferred_finalize: 1 });
        expect(repository.abandonRecoveredReservation).not.toHaveBeenCalled();
    });

    it('never discloses owner ids, share ids, object refs or metadata in the summary', async () => {
        const repository = makeRecoveryRepository({
            discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
        });
        const summary = await runShareLinkRecoveryOnce(makeDependencies(repository));
        const serialized = JSON.stringify(summary);

        expect(serialized).not.toContain(SHARE_ID);
        expect(serialized).not.toContain(OBJECT_REF);
        expect(serialized).not.toContain(OWNER);
        expect(serialized).not.toContain('Shared credentials');
    });

    it('rejects an invalid namespace or claimant before any I/O', async () => {
        const repository = makeRecoveryRepository();

        await expect(
            runShareLinkRecoveryOnce({ ...makeDependencies(repository), namespace: 'bad:ns' })
        ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
        await expect(
            runShareLinkRecoveryOnce({ ...makeDependencies(repository), claimant: '' })
        ).rejects.toMatchObject({ code: 'INVALID_INPUT' });

        expect(repository.discoverRecoverableReservations).not.toHaveBeenCalled();
    });
});

describe('scoped-key share-link recovery retry', () => {
    it('returns committed current state without claiming or re-uploading after response loss', async () => {
        const repository = makeRecoveryRepository({
            readShareLinkRecoveryTarget: vi.fn(async () => ({
                state: 'committed' as const,
                share: makeShare({ status: 'active', contentState: 'finalized', version: 5 }),
            })),
        });
        const stat = vi.fn();
        const result = await recoverShareLinkOperation(
            makeDependencies(repository, stat as never),
            {
                ...recoveryKey(),
            }
        );

        expect(result).toEqual({
            status: 'committed',
            share: expect.objectContaining({ version: 5 }),
        });
        expect(repository.claimRecoverableReservation).not.toHaveBeenCalled();
        expect(stat).not.toHaveBeenCalled();
    });

    it('reports absent for a wrong namespace/owner/operation key without storage I/O', async () => {
        const repository = makeRecoveryRepository({
            readShareLinkRecoveryTarget: vi.fn(async () => ({ state: 'absent' as const })),
        });
        const stat = vi.fn();
        const result = await recoverShareLinkOperation(
            makeDependencies(repository, stat as never),
            recoveryKey()
        );

        expect(result).toEqual({ status: 'absent' });
        expect(stat).not.toHaveBeenCalled();
    });

    it('loads and claims a persisted reservation then verifies storage', async () => {
        const repository = makeRecoveryRepository({
            readShareLinkRecoveryTarget: vi.fn(async () => ({
                state: 'reservation' as const,
                share: makeShare(),
                reservation: makeReservation(),
            })),
        });
        const stat = vi.fn(async () => ({ ok: true as const, value: activeStat() }));
        const result = await recoverShareLinkOperation(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat']),
            recoveryKey()
        );

        expect(result).toMatchObject({ status: 'committed' });
        expect(repository.claimRecoverableReservation).toHaveBeenCalledTimes(1);
        expect(stat).toHaveBeenCalledTimes(1);
    });

    it('abandons an unrecoverable missing object under the recovery fence', async () => {
        const repository = makeRecoveryRepository({
            readShareLinkRecoveryTarget: vi.fn(async () => ({
                state: 'reservation' as const,
                share: makeShare(),
                reservation: makeReservation(),
            })),
        });
        const stat = vi.fn(async () => ({ ok: false as const, error: 'NOT_FOUND' as const }));
        const result = await recoverShareLinkOperation(
            makeDependencies(repository, stat as unknown as ShareContentClient['stat']),
            recoveryKey()
        );

        expect(result).toEqual({ status: 'abandoned' });
        expect(repository.abandonRecoveredReservation).toHaveBeenCalledTimes(1);
    });

    it('surfaces a bounded not-claimable reason instead of a raw error', async () => {
        const repository = makeRecoveryRepository({
            readShareLinkRecoveryTarget: vi.fn(async () => ({
                state: 'reservation' as const,
                share: makeShare(),
                reservation: makeReservation(),
            })),
            claimRecoverableReservation: vi.fn(async () => ({
                outcome: 'not_claimable' as const,
                reason: 'stale_generation' as const,
            })),
        });
        const result = await recoverShareLinkOperation(makeDependencies(repository), recoveryKey());

        expect(result).toEqual({ status: 'not_claimable', reason: 'stale_generation' });
    });
});

describe('recovery review regressions', () => {
    it('rejects a foreign configured namespace before any repository read', async () => {
        const repository = makeRecoveryRepository({
            readShareLinkRecoveryTarget: vi.fn(async () => ({
                state: 'committed',
                share: makeShare(),
            })),
        });
        await expect(
            recoverShareLinkOperation(makeDependencies(repository), {
                ...recoveryKey(),
                namespace: 'foreign',
            })
        ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
        expect(repository.readShareLinkRecoveryTarget).not.toHaveBeenCalled();
    });

    it.each(['active', 'missing'] as const)(
        'leaves production lease time to the repository after locking: %s',
        async outcome => {
            const repository = makeRecoveryRepository({
                discoverRecoverableReservations: vi.fn(async () => ({ keys: [recoveryKey()] })),
            });
            const stat: ShareContentClient['stat'] =
                outcome === 'active'
                    ? async () => ({ ok: true, value: activeStat() })
                    : async () => ({ ok: false, error: 'NOT_FOUND' });
            await runShareLinkRecoveryOnce({
                ...makeDependencies(repository, stat),
                now: undefined,
            });
            expect(repository.claimRecoverableReservation).toHaveBeenCalledWith(
                expect.objectContaining({ now: undefined })
            );
            const mutation =
                outcome === 'active'
                    ? repository.finalizeReservation
                    : repository.abandonRecoveredReservation;
            expect(mutation).toHaveBeenCalledWith(expect.objectContaining({ now: undefined }));
        }
    );
});
