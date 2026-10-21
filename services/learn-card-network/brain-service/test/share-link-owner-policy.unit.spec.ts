import { describe, expect, it, vi } from 'vitest';

import { createShareLinkCoordinator } from '@helpers/share-link-coordinator/coordinator';
import type {
    ShareLinkCoordinatorDependencies,
    ShareLinkLifecycleRepository,
} from '@helpers/share-link-coordinator/types';
import type { ShareContentClient } from '@helpers/share-content-client/types';
import type { ShareLinkRecord } from '../src/models/ShareLink';
import type { ShareLinkReservationRecord } from '../src/accesslayer/share-link/types';

const NAMESPACE = 'test-namespace';
const OWNER = 'owner-1';
const SHARE_ID = Buffer.alloc(16, 1).toString('base64url');
const CLIENT_REQUEST_ID = '22222222-2222-4222-8222-222222222222';

const envelope = {
    v: 1 as const,
    alg: 'A256GCM' as const,
    iv: Buffer.alloc(12, 2).toString('base64url'),
    ct: Buffer.alloc(32, 3).toString('base64url'),
};
const recovery = { protected: 'a', iv: 'b', ciphertext: 'c', tag: 'd' };

const share = (overrides: Partial<ShareLinkRecord> = {}): ShareLinkRecord => ({
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

const reservation = (
    overrides: Partial<ShareLinkReservationRecord> = {}
): ShareLinkReservationRecord => ({
    shareId: SHARE_ID,
    namespace: NAMESPACE,
    ownerProfileId: OWNER,
    opKind: 'create',
    clientRequestId: CLIENT_REQUEST_ID,
    requestHash: 'r'.repeat(64),
    operationId: '11111111-1111-4111-8111-111111111111',
    objectRef: null,
    contentVersion: null,
    baseVersion: 1,
    baseContentVersion: 1,
    contentHash: null,
    contentBytes: null,
    recoveryHash: null,
    recoveryBytes: null,
    title: 'Shared credentials',
    note: null,
    expiresAt: null,
    selectedCount: 1,
    policy: {
        isMinor: null,
        policyResolved: false,
        defaultExpiryDays: 30,
        viewCountingEnabled: false,
    },
    generation: 1,
    leaseOwner: 'worker-1',
    leaseExpiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
});

const request = () => ({
    id: SHARE_ID,
    clientRequestId: CLIENT_REQUEST_ID,
    title: 'Shared credentials',
    selectedCount: 1,
    contentVersion: 1,
    envelope,
    ownerEncryptedRecovery: recovery,
});

describe('coordinator server-derived defaults and intent hashing', () => {
    it('hashes caller intent so a later-clock retry of an omitted-expiry create is stable', async () => {
        const reserveInputs: Array<Record<string, unknown>> = [];

        const repository = {
            reserveCreate: vi.fn(async (input: Record<string, unknown>) => {
                reserveInputs.push(input);
                return {
                    outcome: 'reserved' as const,
                    state: 'created' as const,
                    share: share(),
                    reservation: reservation(),
                };
            }),
            finalizeReservation: vi.fn(async () => ({
                outcome: 'finalized' as const,
                share: share({ status: 'active' as const, contentState: 'finalized' as const }),
                cleanupQueuedFor: null,
            })),
        } as unknown as ShareLinkLifecycleRepository;

        const client = {} as unknown as ShareLinkCoordinatorDependencies['client'];
        const clocks = [new Date('2026-09-21T00:00:00.000Z'), new Date('2026-10-01T00:00:00.000Z')];
        let clock = clocks[0]!;

        const coordinator = createShareLinkCoordinator({
            repository,
            client,
            leaseOwner: 'worker-1',
            now: () => clock,
            policyResolver: {
                resolve: async () => ({
                    isMinor: false,
                    policyResolved: true,
                    defaultExpiryDays: 365,
                    viewCountingEnabled: true,
                }),
            },
        });

        await coordinator.createShareLink(request(), {
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
        });

        clock = clocks[1]!;

        await coordinator.createShareLink(request(), {
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
        });

        // Caller intent is identical regardless of the clock, so the idempotency
        // hash cannot drift and turn a retry into a conflict.
        expect(reserveInputs).toHaveLength(2);
        expect(reserveInputs[0]!.requestHash).toBe(reserveInputs[1]!.requestHash);
        // The server-derived default comes from the policy, not the caller.
        expect(reserveInputs[0]!.expiresAt).toBe('2027-09-21T00:00:00.000Z');
        expect(reserveInputs[0]!.policy).toEqual({
            isMinor: false,
            policyResolved: true,
            defaultExpiryDays: 365,
            viewCountingEnabled: true,
        });
    });

    it('falls back to the conservative policy when no resolver is injected', async () => {
        const reserveInputs: Array<Record<string, unknown>> = [];
        const repository = {
            reserveCreate: vi.fn(async (input: Record<string, unknown>) => {
                reserveInputs.push(input);
                return {
                    outcome: 'reserved' as const,
                    state: 'created' as const,
                    share: share(),
                    reservation: reservation(),
                };
            }),
            finalizeReservation: vi.fn(async () => ({
                outcome: 'finalized' as const,
                share: share({ status: 'active' as const, contentState: 'finalized' as const }),
                cleanupQueuedFor: null,
            })),
        } as unknown as ShareLinkLifecycleRepository;

        const coordinator = createShareLinkCoordinator({
            repository,
            client: {} as unknown as ShareLinkCoordinatorDependencies['client'],
            leaseOwner: 'worker-1',
            now: () => new Date('2026-09-21T00:00:00.000Z'),
        });

        await coordinator.createShareLink(request(), {
            namespace: NAMESPACE,
            ownerProfileId: OWNER,
        });

        expect(reserveInputs[0]!.policy).toEqual({
            isMinor: null,
            policyResolved: false,
            defaultExpiryDays: 30,
            viewCountingEnabled: false,
        });
    });
});

// Ensure the client mock type is referenced (it is intentionally opaque here).
void ({} as ShareContentClient);
