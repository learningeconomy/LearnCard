import { beforeEach, describe, expect, it, vi } from 'vitest';

import { computeShareLinkPayloadHash } from '@helpers/share-link-lifecycle';
import {
    createShareLinkCoordinator,
    runShareContentCleanupOnce,
} from '@helpers/share-link-coordinator';
import type {
    ShareLinkCoordinatorDependencies,
    ShareLinkLifecycleRepository,
} from '@helpers/share-link-coordinator';

import type { ShareContentClient } from '../src/helpers/share-content-client';
import { ShareLinkRepositoryError } from '../src/accesslayer/share-link/errors';
import type { ShareLinkRecord } from '../src/models/ShareLink';
import type {
    ShareLinkOperationKind,
    ShareLinkReservationRecord,
} from '../src/accesslayer/share-link';

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
const recoveryBytes = Buffer.byteLength(JSON.stringify(recovery), 'utf8');

const payloadHash = computeShareLinkPayloadHash({
    envelope,
    ownerEncryptedRecovery: recovery,
});

const createRequest = () => ({
    id: SHARE_ID,
    clientRequestId: CLIENT_REQUEST_ID,
    title: 'Shared credentials',
    selectedCount: 1,
    notifyOnView: false,
    contentVersion: 1,
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
    passcodeHash: null,
    notifyOnView: false,
    generation: 1,
    leaseOwner: 'worker-1',
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

const makeClient = (overrides: Partial<ShareContentClient> = {}) =>
    ({
        put: vi.fn(async () => ({
            ok: true,
            value: { status: 'created', record: activeStat() },
        })),
        stat: vi.fn(async () => ({ ok: true, value: activeStat() })),
        delete: vi.fn(async () => ({
            ok: true,
            value: {
                kind: 'tombstone',
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId: SHARE_ID,
                contentVersion: 1,
                objectId: OBJECT_REF,
                operationId: OPERATION_ID,
                deletedAt: '2026-09-20T00:00:00.000Z',
            },
        })),
        get: vi.fn(),
        readRecovery: vi.fn(),
        config: {},
        ...overrides,
    }) as unknown as ShareContentClient;

const makeRepository = (overrides: Partial<ShareLinkLifecycleRepository> = {}) =>
    ({
        reserveCreate: vi.fn(),
        reserveReplacement: vi.fn(),
        finalizeReservation: vi.fn(async () => ({
            outcome: 'finalized',
            share: makeShare({ status: 'active', contentState: 'finalized', version: 2 }),
            cleanupQueuedFor: null,
        })),
        abandonReservation: vi.fn(async () => ({
            outcome: 'abandoned',
            cleanupQueuedFor: OBJECT_REF,
        })),
        revokeShareLink: vi.fn(),
        getShareLink: vi.fn(),
        getCurrentShareContent: vi.fn(),
        claimCleanupJobs: vi.fn(),
        completeCleanupJob: vi.fn(),
        ...overrides,
    }) as unknown as ShareLinkLifecycleRepository;

const makeCoordinator = (
    repository: ShareLinkLifecycleRepository,
    client: ShareContentClient,
    overrides: Partial<ShareLinkCoordinatorDependencies> = {}
) =>
    createShareLinkCoordinator({
        repository,
        client,
        leaseOwner: 'worker-1',
        leaseMs: 60_000,
        now: () => new Date('2026-09-20T00:00:00.000Z'),
        ...overrides,
    });

const context = { namespace: NAMESPACE, ownerProfileId: OWNER };

describe('share-link coordinator create', () => {
    let repository: ShareLinkLifecycleRepository;
    let client: ShareContentClient;

    beforeEach(() => {
        repository = makeRepository();
        client = makeClient();
    });

    it('reserves with the payload hash, uploads the reserved ids, verifies stat and finalizes', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare(),
            reservation: makeReservation(),
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.createShareLink(createRequest(), context);

        expect(result.status).toBe('committed');
        const reserveArgs = (repository.reserveCreate as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(reserveArgs.content.contentHash).toBe(payloadHash);
        expect(reserveArgs.content.contentBytes).toBe(32);
        expect(reserveArgs.content.recoveryBytes).toBe(recoveryBytes);
        expect(reserveArgs.requestHash).toMatch(/^[0-9a-f]{64}$/);

        const putArgs = (client.put as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(putArgs.objectId).toBe(OBJECT_REF);
        expect(putArgs.operationId).toBe(OPERATION_ID);
        expect(putArgs.contentVersion).toBe(1);

        const statArgs = (client.stat as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(statArgs.objectId).toBe(OBJECT_REF);

        const finalizeArgs = (repository.finalizeReservation as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
        expect(finalizeArgs.verifiedContentHash).toBe(payloadHash);
        expect(finalizeArgs.objectRef).toBe(OBJECT_REF);
    });

    it('hashes a passcode before persistence and keeps notification opt-in explicit', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare(),
            reservation: makeReservation(),
        });

        const coordinator = makeCoordinator(repository, client, {
            policyResolver: {
                resolve: vi.fn(async () => ({
                    isMinor: false,
                    policyResolved: true,
                    defaultExpiryDays: 365,
                    viewCountingEnabled: true,
                })),
            },
        });
        await coordinator.createShareLink(
            { ...createRequest(), passcode: '2468', notifyOnView: true },
            context
        );

        const reserveArgs = (repository.reserveCreate as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(reserveArgs.passcodeHash).toMatch(/^\$argon2id\$/);
        expect(reserveArgs.passcodeHash).not.toContain('2468');
        expect(reserveArgs).not.toHaveProperty('passcode');
        expect(reserveArgs.notifyOnView).toBe(true);
    });

    it('suppresses view notifications when the trusted policy disables view counting', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare(),
            reservation: makeReservation(),
        });

        const coordinator = makeCoordinator(repository, client, {
            policyResolver: {
                resolve: vi.fn(async () => ({
                    isMinor: true,
                    policyResolved: true,
                    defaultExpiryDays: 30,
                    viewCountingEnabled: false,
                })),
            },
        });
        await coordinator.createShareLink({ ...createRequest(), notifyOnView: true }, context);

        const reserveArgs = (repository.reserveCreate as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(reserveArgs.notifyOnView).toBe(false);
        expect(reserveArgs.policy.defaultExpiryDays).toBe(30);
    });

    it('drives a resumed in-flight create to the same reserved object', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'resumed',
            share: makeShare(),
            reservation: makeReservation(),
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.createShareLink(createRequest(), context);

        expect(result.status).toBe('committed');
        const putArgs = (client.put as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(putArgs.objectId).toBe(OBJECT_REF);
        expect(putArgs.operationId).toBe(OPERATION_ID);
        expect(repository.finalizeReservation).toHaveBeenCalledTimes(1);
    });

    it('returns the recorded result for a committed retry without re-uploading', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'already_committed',
            recorded: makeShare({ version: 2, status: 'active', contentState: 'finalized' }),
            current: makeShare({ version: 3, status: 'active', contentState: 'finalized' }),
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.createShareLink(createRequest(), context);

        expect(result.status).toBe('replayed');
        if (result.status === 'replayed') {
            expect(result.share.version).toBe(3);
            expect(result.recorded.version).toBe(2);
        }
        expect(client.put).not.toHaveBeenCalled();
        expect(client.stat).not.toHaveBeenCalled();
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
    });

    it('keeps a transient upload failure resumable without abandoning the reservation', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare(),
            reservation: makeReservation(),
        });
        (client.put as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            error: 'UNAVAILABLE',
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.createShareLink(createRequest(), context);

        expect(result.status).toBe('pending');
        if (result.status === 'pending') expect(result.reason).toBe('upload_unavailable');
        expect(repository.abandonReservation).not.toHaveBeenCalled();
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
    });

    it('abandons and rethrows a deterministic upload rejection', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare(),
            reservation: makeReservation(),
        });
        (client.put as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            error: 'CONFLICT',
        });

        const coordinator = makeCoordinator(repository, client);

        await expect(coordinator.createShareLink(createRequest(), context)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect(repository.abandonReservation).toHaveBeenCalledTimes(1);
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
    });

    it('never finalizes on a wrong stat hash and never destroys the staged object', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare(),
            reservation: makeReservation(),
        });
        (client.stat as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            value: activeStat({ payloadHash: 'e'.repeat(64) }),
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.createShareLink(createRequest(), context);

        expect(result.status).toBe('pending');
        if (result.status === 'pending') expect(result.reason).toBe('stat_mismatch');
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
        expect(repository.abandonReservation).not.toHaveBeenCalled();
    });

    it('abandons a tombstoned reservation and surfaces a conflict', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare(),
            reservation: makeReservation(),
        });
        (client.stat as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            value: {
                kind: 'tombstone',
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId: SHARE_ID,
                contentVersion: 1,
                objectId: OBJECT_REF,
                operationId: OPERATION_ID,
                deletedAt: '2026-09-20T00:00:00.000Z',
            },
        });

        const coordinator = makeCoordinator(repository, client);

        await expect(coordinator.createShareLink(createRequest(), context)).rejects.toMatchObject({
            code: 'CONFLICT',
        });
        expect(repository.abandonReservation).toHaveBeenCalledTimes(1);
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
    });

    it('returns a resumable pending result for an ambiguous finalize failure', async () => {
        (repository.reserveCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare(),
            reservation: makeReservation(),
        });
        (repository.finalizeReservation as ReturnType<typeof vi.fn>).mockRejectedValue(
            new Error('neo4j unavailable')
        );

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.createShareLink(createRequest(), context);

        expect(result.status).toBe('pending');
        if (result.status === 'pending') expect(result.reason).toBe('finalize_unavailable');
        expect(repository.abandonReservation).not.toHaveBeenCalled();
    });

    it('rejects invalid requests and contexts before any I/O', async () => {
        const coordinator = makeCoordinator(repository, client);

        await expect(
            coordinator.createShareLink({ ...createRequest(), title: '' }, context)
        ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
        await expect(
            coordinator.createShareLink(createRequest(), {
                namespace: 'bad:ns',
                ownerProfileId: OWNER,
            })
        ).rejects.toMatchObject({ code: 'INVALID_INPUT' });
        expect(repository.reserveCreate).not.toHaveBeenCalled();
    });
});

describe('share-link coordinator update', () => {
    let repository: ShareLinkLifecycleRepository;
    let client: ShareContentClient;

    beforeEach(() => {
        repository = makeRepository();
        client = makeClient();
    });

    it('metadata-only update uploads nothing and finalizes with a null object ref', async () => {
        (repository.reserveReplacement as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare({ status: 'active', contentState: 'finalized', version: 2 }),
            reservation: makeReservation({
                opKind: 'update',
                objectRef: null,
                contentVersion: null,
                contentHash: null,
                contentBytes: null,
                recoveryHash: null,
                recoveryBytes: null,
                title: 'Renamed',
            }),
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.updateShareLink(
            {
                id: SHARE_ID,
                expectedVersion: 2,
                clientRequestId: CLIENT_REQUEST_ID,
                title: 'Renamed',
            },
            context
        );

        expect(result.status).toBe('committed');
        expect(client.put).not.toHaveBeenCalled();
        expect(client.stat).not.toHaveBeenCalled();

        const finalizeArgs = (repository.finalizeReservation as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
        expect(finalizeArgs.objectRef).toBeNull();
        expect(finalizeArgs.verifiedContentHash).toBeUndefined();
    });

    it('hashes, replaces, and removes passcode protection without persisting plaintext', async () => {
        (repository.reserveReplacement as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare({ status: 'active', contentState: 'finalized', version: 2 }),
            reservation: makeReservation({
                opKind: 'update',
                objectRef: null,
                contentVersion: null,
                contentHash: null,
                contentBytes: null,
                recoveryHash: null,
                recoveryBytes: null,
            }),
        });

        const coordinator = makeCoordinator(repository, client, {
            policyResolver: {
                resolve: vi.fn(async () => ({
                    isMinor: false,
                    policyResolved: true,
                    defaultExpiryDays: 365,
                    viewCountingEnabled: true,
                })),
            },
        });
        await coordinator.updateShareLink(
            {
                id: SHARE_ID,
                expectedVersion: 2,
                clientRequestId: CLIENT_REQUEST_ID,
                passcode: '8642',
                notifyOnView: true,
            },
            context
        );

        const protectedArgs = (repository.reserveReplacement as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
        expect(protectedArgs.passcodeHash).toMatch(/^\$argon2id\$/);
        expect(protectedArgs.passcodeHash).not.toContain('8642');
        expect(protectedArgs).not.toHaveProperty('passcode');
        expect(protectedArgs.notifyOnView).toBe(true);

        await coordinator.updateShareLink(
            {
                id: SHARE_ID,
                expectedVersion: 2,
                clientRequestId: '22222222-2222-4222-8222-222222222222',
                passcode: null,
                notifyOnView: false,
            },
            context
        );

        const unprotectedArgs = (repository.reserveReplacement as ReturnType<typeof vi.fn>).mock
            .calls[1][0];
        expect(unprotectedArgs.passcodeHash).toBeNull();
        expect(unprotectedArgs.notifyOnView).toBe(false);
    });

    it('suppresses an update that enables notifications under restrictive policy', async () => {
        (repository.reserveReplacement as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare({ status: 'active', contentState: 'finalized', version: 2 }),
            reservation: makeReservation({
                opKind: 'update',
                objectRef: null,
                contentVersion: null,
                contentHash: null,
                contentBytes: null,
                recoveryHash: null,
                recoveryBytes: null,
            }),
        });

        const coordinator = makeCoordinator(repository, client, {
            policyResolver: {
                resolve: vi.fn(async () => ({
                    isMinor: true,
                    policyResolved: true,
                    defaultExpiryDays: 30,
                    viewCountingEnabled: false,
                })),
            },
        });
        await coordinator.updateShareLink(
            {
                id: SHARE_ID,
                expectedVersion: 2,
                clientRequestId: CLIENT_REQUEST_ID,
                notifyOnView: true,
            },
            context
        );

        const reserveArgs = (repository.reserveReplacement as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
        expect(reserveArgs.notifyOnView).toBe(false);
    });

    it('content update uploads and finalizes the replacement', async () => {
        (repository.reserveReplacement as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'reserved',
            state: 'created',
            share: makeShare({ status: 'active', contentState: 'finalized', version: 2 }),
            reservation: makeReservation({
                opKind: 'update',
                contentVersion: 2,
                baseContentVersion: 1,
                contentHash: payloadHash,
            }),
        });
        (client.stat as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: true,
            value: activeStat({ contentVersion: 2 }),
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.updateShareLink(
            {
                id: SHARE_ID,
                expectedVersion: 2,
                clientRequestId: CLIENT_REQUEST_ID,
                contentVersion: 2,
                selectedCount: 1,
                envelope,
                ownerEncryptedRecovery: recovery,
            },
            context
        );

        expect(result.status).toBe('committed');
        expect(client.put).toHaveBeenCalledTimes(1);
        expect(client.stat).toHaveBeenCalledTimes(1);
    });

    it('does not re-upload a committed update retry', async () => {
        (repository.reserveReplacement as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'already_committed',
            recorded: makeShare({ status: 'active', contentState: 'finalized', version: 3 }),
            current: makeShare({ status: 'active', contentState: 'finalized', version: 3 }),
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.updateShareLink(
            {
                id: SHARE_ID,
                expectedVersion: 2,
                clientRequestId: CLIENT_REQUEST_ID,
                title: 'Renamed',
            },
            context
        );

        expect(result.status).toBe('replayed');
        expect(client.put).not.toHaveBeenCalled();
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
    });
});

describe('share-link coordinator revoke and reads', () => {
    it('revokes and returns the queued cleanup refs without any network call', async () => {
        const repository = makeRepository();
        const client = makeClient();
        (repository.revokeShareLink as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'revoked',
            share: makeShare({ status: 'stopped' }),
            cleanupQueuedFor: [OBJECT_REF],
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.revokeShareLink(
            { id: SHARE_ID, clientRequestId: CLIENT_REQUEST_ID },
            context
        );

        expect(result.status).toBe('revoked');
        expect(result.cleanupQueuedFor).toEqual([OBJECT_REF]);
        expect(client.delete).not.toHaveBeenCalled();
    });

    it.each(['stopped', 'expired', 'replaced'])(
        'withholds content when %s during the remote read',
        async change => {
            const repository = makeRepository();
            const client = makeClient();
            const initial = {
                state: 'active',
                namespace: NAMESPACE,
                ownerProfileId: OWNER,
                shareId: SHARE_ID,
                version: 1,
                contentVersion: 1,
                objectRef: OBJECT_REF,
                operationId: OPERATION_ID,
            };
            (repository.getCurrentShareContent as ReturnType<typeof vi.fn>)
                .mockResolvedValueOnce(initial)
                .mockResolvedValueOnce(
                    change === 'replaced'
                        ? { ...initial, version: 2, objectRef: 'replacement' }
                        : { state: 'not_active', reason: change }
                );
            (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({
                ok: true,
                value: { envelope: { ct: 'withheld' } },
            });
            expect(
                await makeCoordinator(repository, client).fetchShareContent(SHARE_ID, context)
            ).toEqual({ ok: false, error: 'NOT_FOUND' });
            expect(client.get).toHaveBeenCalledOnce();
        }
    );

    it('reads content with the original object operation id, never the metadata one', async () => {
        const repository = makeRepository();
        const client = makeClient();
        (repository.getCurrentShareContent as ReturnType<typeof vi.fn>).mockResolvedValue({
            state: 'active',
            shareId: SHARE_ID,
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
            version: 5,
            contentVersion: 2,
            objectRef: OBJECT_REF,
            operationId: OPERATION_ID,
            contentHash: 'd'.repeat(64),
            contentBytes: 32,
            recoveryHash: 'c'.repeat(64),
            selectedCount: 1,
            expiresAt: null,
            updatedAt: '2026-09-20T00:00:00.000Z',
        });
        (client.get as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, value: {} });

        const coordinator = makeCoordinator(repository, client);
        await coordinator.fetchShareContent(SHARE_ID, context);

        const getArgs = (client.get as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(getArgs.operationId).toBe(OPERATION_ID);
        expect(getArgs.objectId).toBe(OBJECT_REF);
        expect(getArgs.contentVersion).toBe(2);
    });
});

describe('share-link coordinator resumable pending operations', () => {
    it('stats and finalizes a verified existing object without request bytes', async () => {
        const repository = makeRepository();
        const client = makeClient();
        const coordinator = makeCoordinator(repository, client);

        const result = await coordinator.resumePendingOperation({
            reservation: makeReservation(),
        });

        expect(result.status).toBe('committed');
        expect(client.put).not.toHaveBeenCalled();
        expect(repository.finalizeReservation).toHaveBeenCalledTimes(1);
    });

    it('abandons an absent object with cleanup instead of reconstructing ciphertext', async () => {
        const repository = makeRepository();
        const client = makeClient();
        (client.stat as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            error: 'NOT_FOUND',
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.resumePendingOperation({
            reservation: makeReservation(),
        });

        expect(result.status).toBe('abandoned');
        expect(repository.abandonReservation).toHaveBeenCalledTimes(1);
        expect(repository.finalizeReservation).not.toHaveBeenCalled();
    });

    it('does not abandon on a transient stat failure', async () => {
        const repository = makeRepository();
        const client = makeClient();
        (client.stat as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            error: 'TIMEOUT',
        });

        const coordinator = makeCoordinator(repository, client);
        const result = await coordinator.resumePendingOperation({
            reservation: makeReservation(),
        });

        expect(result.status).toBe('pending');
        expect(repository.abandonReservation).not.toHaveBeenCalled();
    });

    it('re-uploads the exact reserved ids on a stateless retry with bytes', async () => {
        const repository = makeRepository();
        const client = makeClient();
        const coordinator = makeCoordinator(repository, client);

        const result = await coordinator.resumePendingOperation(
            { reservation: makeReservation() },
            { envelope, ownerEncryptedRecovery: recovery }
        );

        expect(result.status).toBe('committed');
        const putArgs = (client.put as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(putArgs.objectId).toBe(OBJECT_REF);
        expect(putArgs.operationId).toBe(OPERATION_ID);
    });

    it('surfaces a typed lifecycle error instead of masking it as pending', async () => {
        const repository = makeRepository();
        const client = makeClient();
        (repository.finalizeReservation as ReturnType<typeof vi.fn>).mockRejectedValue(
            new ShareLinkRepositoryError('LEASE_EXPIRED', 'lease lapsed')
        );

        const coordinator = makeCoordinator(repository, client);

        await expect(
            coordinator.resumePendingOperation({ reservation: makeReservation() })
        ).rejects.toMatchObject({ code: 'LEASE_EXPIRED' });
    });
});

describe('bounded one-shot cleanup runner', () => {
    const job = (overrides: Record<string, unknown> = {}) => ({
        objectRef: OBJECT_REF,
        operationId: OPERATION_ID,
        namespace: NAMESPACE,
        ownerProfileId: OWNER,
        shareId: SHARE_ID,
        contentVersion: 1,
        reason: 'stopped' as const,
        status: 'claimed' as const,
        attempts: 0,
        nextAttemptAt: '2026-09-20T00:00:00.000Z',
        claimToken: 'claim-1',
        claimedBy: 'cleaner',
        claimExpiresAt: '2099-01-01T00:00:00.000Z',
        lastError: null,
        createdAt: '2026-09-20T00:00:00.000Z',
        updatedAt: '2026-09-20T00:00:00.000Z',
        completedAt: null,
        ...overrides,
    });

    it('completes on a proven deletion using the original object operation id', async () => {
        const repository = makeRepository();
        const client = makeClient();
        (repository.claimCleanupJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
            claimToken: 'claim-1',
            jobs: [job()],
        });
        (repository.completeCleanupJob as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'completed',
            job: job({ status: 'completed' }),
        });

        const summary = await runShareContentCleanupOnce({
            repository,
            client,
            claimant: 'cleaner',
            namespace: NAMESPACE,
            now: () => new Date('2026-09-20T00:00:00.000Z'),
        });

        expect(summary).toMatchObject({ claimed: 1, completed: 1, retried: 0, claimLost: 0 });
        const deleteArgs = (client.delete as ReturnType<typeof vi.fn>).mock.calls[0][0];
        expect(deleteArgs.operationId).toBe(OPERATION_ID);
        expect(deleteArgs.objectId).toBe(OBJECT_REF);
        const completeArgs = (repository.completeCleanupJob as ReturnType<typeof vi.fn>).mock
            .calls[0][0];
        expect(completeArgs).toMatchObject({ outcome: 'completed', claimToken: 'claim-1' });
    });

    it('returns an unavailable deletion to the queue with backoff', async () => {
        const repository = makeRepository();
        const client = makeClient();
        (repository.claimCleanupJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
            claimToken: 'claim-1',
            jobs: [job()],
        });
        (client.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            error: 'UNAVAILABLE',
        });
        (repository.completeCleanupJob as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'retry',
            job: job({ status: 'queued', attempts: 1 }),
        });

        const summary = await runShareContentCleanupOnce({
            repository,
            client,
            claimant: 'cleaner',
            namespace: NAMESPACE,
        });

        expect(summary).toMatchObject({ claimed: 1, completed: 0, retried: 1 });
        expect(
            (repository.completeCleanupJob as ReturnType<typeof vi.fn>).mock.calls[0][0]
        ).toMatchObject({ outcome: 'retry', errorMessage: 'UNAVAILABLE' });
    });

    it('never completes a deterministic failure and leaves the claim fenced', async () => {
        const repository = makeRepository();
        const client = makeClient();
        (repository.claimCleanupJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
            claimToken: 'claim-1',
            jobs: [job()],
        });
        (client.delete as ReturnType<typeof vi.fn>).mockResolvedValue({
            ok: false,
            error: 'UNAUTHORIZED',
        });

        const summary = await runShareContentCleanupOnce({
            repository,
            client,
            claimant: 'cleaner',
            namespace: NAMESPACE,
        });

        expect(summary).toMatchObject({ claimed: 1, completed: 0, retried: 0, claimLost: 0 });
        expect(summary.skipped).toBe(1);
        expect(summary.categories).toEqual({ UNAUTHORIZED: 1 });
        expect(repository.completeCleanupJob).not.toHaveBeenCalled();
    });

    it('records a lost claim without pretending the deletion happened', async () => {
        const repository = makeRepository();
        const client = makeClient();
        (repository.claimCleanupJobs as ReturnType<typeof vi.fn>).mockResolvedValue({
            claimToken: 'old-claim',
            jobs: [job()],
        });
        (repository.completeCleanupJob as ReturnType<typeof vi.fn>).mockResolvedValue({
            outcome: 'claim_lost',
        });

        const summary = await runShareContentCleanupOnce({
            repository,
            client,
            claimant: 'cleaner',
            namespace: NAMESPACE,
        });

        expect(summary).toMatchObject({ claimed: 1, completed: 0, claimLost: 1 });
    });
});
