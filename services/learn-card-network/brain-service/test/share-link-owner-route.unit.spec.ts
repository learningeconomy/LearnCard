import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import {
    AUTH_GRANT_SHARE_LINKS_READ_SCOPE,
    AUTH_GRANT_SHARE_LINKS_WRITE_SCOPE,
} from 'src/constants/auth-grant';
import { ShareLinkCoordinatorError } from '@helpers/share-link-coordinator';
import type {
    RecoveryRunnerDependencies,
    ShareLinkCoordinator,
} from '@helpers/share-link-coordinator';
import type { ShareLinkRecord } from '../src/models/ShareLink';

/**
 * LC-2187 owner API route-boundary tests.
 *
 * These exercise the REAL tRPC procedure chain: the same did/challenge/profile
 * and scope middleware as production (only the Sentry transport and the backing
 * repository/coordinator are fakes). No unprotected procedure replaces
 * `profileRoute`.
 */

const OWNER_PROFILE = {
    profileId: 'owner-1',
    did: 'did:key:owner-1',
    displayName: 'Owner One',
};

const sentry = vi.hoisted(() => ({
    trpcMiddleware: vi.fn(() => async (opts: { next: () => unknown }) => opts.next()),
    setUser: vi.fn(),
    configureScope: vi.fn(),
}));

vi.mock('@sentry/serverless', () => ({
    Handlers: { trpcMiddleware: sentry.trpcMiddleware },
    setUser: sentry.setUser,
    configureScope: sentry.configureScope,
}));

vi.mock('@accesslayer/profile/read', () => ({
    getProfileByDid: vi.fn(async () => OWNER_PROFILE),
    getProfileByProfileId: vi.fn(async () => OWNER_PROFILE),
}));

const rateLimits = vi.hoisted(() => ({ enforceRateLimits: vi.fn(async () => undefined) }));

vi.mock('@helpers/rateLimit.helpers', () => ({
    enforceRateLimits: rateLimits.enforceRateLimits,
}));

const recoveryRunner = vi.hoisted(() => ({
    recoverShareLinkOperation: vi.fn(),
    runShareLinkRecoveryOnce: vi.fn(),
}));

vi.mock('@helpers/share-link-coordinator/recovery-runner', () => ({
    recoverShareLinkOperation: recoveryRunner.recoverShareLinkOperation,
    runShareLinkRecoveryOnce: recoveryRunner.runShareLinkRecoveryOnce,
}));

import { createShareLinksRouter, enforceOwnerShareWriteRateLimit } from '../src/routes/share-links';
import type { ShareLinkRouterDependencies } from '../src/routes/share-links';
import { encodeShareLinkListCursor } from '../src/accesslayer/share-link/list';

const NAME = 'deployment-ns';
const SHARE_ID = Buffer.alloc(16, 7).toString('base64url');
const OPERATION_ID = randomUUID();

const envelope = {
    v: 1 as const,
    alg: 'A256GCM' as const,
    iv: Buffer.alloc(12, 1).toString('base64url'),
    ct: Buffer.alloc(32, 2).toString('base64url'),
};
const recovery = { protected: 'p', iv: 'i', ciphertext: 'c', tag: 't' };

const createInput = () => ({
    id: SHARE_ID,
    clientRequestId: randomUUID(),
    title: 'Shared credentials',
    selectedCount: 1,
    contentVersion: 1 as const,
    envelope,
    ownerEncryptedRecovery: recovery,
});

const shareRecord = (overrides: Partial<ShareLinkRecord> = {}): ShareLinkRecord => ({
    id: SHARE_ID,
    namespace: NAME,
    ownerProfileId: OWNER_PROFILE.profileId,
    version: 1,
    contentVersion: 1,
    generation: 1,
    status: 'active',
    contentState: 'finalized',
    // Internal fields that must never leak through the projection.
    activeObjectRef: 'internal-object-ref',
    activeObjectOperationId: OPERATION_ID,
    activeContentHash: 'internal-content-hash',
    activeContentBytes: 123,
    activeRecoveryHash: 'internal-recovery-hash',
    lastOperationId: OPERATION_ID,
    createdByClientRequestId: 'client-request-id',
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

const baseCoordinator = (): ShareLinkCoordinator => ({
    createShareLink: vi.fn(async () => ({ status: 'committed', share: shareRecord() })),
    updateShareLink: vi.fn(async () => ({ status: 'committed', share: shareRecord() })),
    revokeShareLink: vi.fn(async () => ({
        status: 'revoked',
        share: shareRecord({ status: 'stopped', stoppedAt: '2026-09-21T00:00:00.000Z' }),
        cleanupQueuedFor: [],
    })),
    resumePendingOperation: vi.fn(),
    abandonPendingOperation: vi.fn(),
    getShareLink: vi.fn(async () => shareRecord()),
    getActiveShareContent: vi.fn(),
    fetchShareContent: vi.fn(),
    readOwnerRecovery: vi.fn(async () => ({
        ok: true as const,
        value: { ownerEncryptedRecovery: recovery },
    })),
});

const baseRecovery = (): RecoveryRunnerDependencies =>
    ({
        repository: {
            readShareLinkRecoveryTarget: vi.fn(async () => ({
                state: 'absent' as const,
            })),
        },
        client: {},
        claimant: 'route-test',
        namespace: NAME,
    }) as unknown as RecoveryRunnerDependencies;

const makeDependencies = (
    overrides: {
        coordinator?: Partial<ShareLinkCoordinator>;
        recovery?: RecoveryRunnerDependencies;
        listShareLinks?: ShareLinkRouterDependencies['listShareLinks'];
        enforceOwnerWriteRateLimit?: (ownerProfileId: string) => Promise<void>;
        resolveViewCountingEligibility?: (ownerProfileId: string) => Promise<boolean>;
    } = {}
) => ({
    namespace: NAME,
    coordinator: { ...baseCoordinator(), ...overrides.coordinator } as ShareLinkCoordinator,
    recovery: overrides.recovery ?? baseRecovery(),
    listShareLinks:
        overrides.listShareLinks ??
        vi.fn(async () => ({ records: [], hasMore: false, nextCursor: null })),
    enforceOwnerWriteRateLimit:
        overrides.enforceOwnerWriteRateLimit ?? vi.fn(async () => undefined),
    resolveViewCountingEligibility:
        overrides.resolveViewCountingEligibility ?? vi.fn(async () => true),
});

const makeCaller = (
    dependencies: ReturnType<typeof makeDependencies> | null,
    options: {
        user?: { did: string; isChallengeValid: boolean; scope: string } | undefined;
        getDependenciesError?: Error;
    } = {}
) => {
    const router = createShareLinksRouter(async () => {
        if (options.getDependenciesError) throw options.getDependenciesError;
        return dependencies;
    });

    return router.createCaller({
        domain: 'network.example.com',
        tenant: { id: 'default' },
        user: 'user' in options ? options.user : authenticatedUser,
    } as never);
};

const authenticatedUser = {
    did: OWNER_PROFILE.did,
    isChallengeValid: true,
    scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
};

beforeEach(() => {
    rateLimits.enforceRateLimits.mockReset();
    rateLimits.enforceRateLimits.mockResolvedValue(undefined);
    recoveryRunner.recoverShareLinkOperation.mockReset();
});

describe('share-link owner route boundary', () => {
    it('captures transaction names but never attaches share-link RPC input', async () => {
        await makeCaller(makeDependencies()).get({ id: SHARE_ID });

        expect(sentry.trpcMiddleware).toHaveBeenCalledWith({ attachRpcInput: false });
        expect(sentry.configureScope).toHaveBeenCalled();
    });

    it('answers NOT_FOUND and touches nothing when configuration is disabled', async () => {
        const dependencies = makeDependencies();
        const caller = makeCaller(null);

        await expect(caller.create(createInput())).rejects.toMatchObject({ code: 'NOT_FOUND' });
        expect(dependencies.coordinator.createShareLink).not.toHaveBeenCalled();
    });

    it('rejects an unauthenticated caller before any dependency work', async () => {
        const dependencies = makeDependencies();
        const caller = makeCaller(dependencies, { user: undefined as never });

        await expect(caller.create(createInput())).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(dependencies.coordinator.createShareLink).not.toHaveBeenCalled();
    });

    it('rejects a caller without a valid challenge', async () => {
        const dependencies = makeDependencies();
        const caller = makeCaller(dependencies, {
            user: { ...authenticatedUser, isChallengeValid: false },
        });

        await expect(caller.create(createInput())).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(dependencies.coordinator.createShareLink).not.toHaveBeenCalled();
    });

    it('rejects insufficient scopes', async () => {
        const dependencies = makeDependencies();
        const caller = makeCaller(dependencies, {
            user: { ...authenticatedUser, scope: AUTH_GRANT_SHARE_LINKS_READ_SCOPE },
        });

        await expect(caller.create(createInput())).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        expect(dependencies.coordinator.createShareLink).not.toHaveBeenCalled();
    });

    it('derives owner and namespace from the authenticated context, not the body', async () => {
        const dependencies = makeDependencies();
        const caller = makeCaller(dependencies);

        await caller.create(createInput());

        expect(dependencies.coordinator.createShareLink).toHaveBeenCalledWith(expect.anything(), {
            namespace: NAME,
            ownerProfileId: OWNER_PROFILE.profileId,
        });
    });

    it('answers not_found for a cross-owner read without leaking the target owner', async () => {
        const dependencies = makeDependencies({
            coordinator: { getShareLink: vi.fn(async () => null) },
        });
        const caller = makeCaller(dependencies);

        await expect(caller.get({ id: SHARE_ID })).resolves.toEqual({
            status: 'not_found',
            id: SHARE_ID,
        });
        expect(dependencies.coordinator.getShareLink).toHaveBeenCalledWith(SHARE_ID, {
            namespace: NAME,
            ownerProfileId: OWNER_PROFILE.profileId,
        });
    });

    it('returns only the safe owner projection', async () => {
        const caller = makeCaller(makeDependencies());

        const result = await caller.get({ id: SHARE_ID });

        expect(result.status).toBe('found');
        if (result.status !== 'found') throw new Error('unreachable');
        expect(Object.keys(result.share).sort()).toEqual(
            expect.arrayContaining(['id', 'title', 'minorPolicy', 'status'])
        );
        expect(result.share).not.toHaveProperty('activeObjectRef');
        expect(result.share).not.toHaveProperty('activeContentHash');
        expect(result.share).not.toHaveProperty('lastOperationId');
        expect(result.share).not.toHaveProperty('createdByClientRequestId');
    });

    it('suppresses viewCount and lastViewedAt for a currently ineligible owner', async () => {
        // Formerly eligible snapshot: committed counting enabled, count present.
        const dependencies = makeDependencies({
            coordinator: {
                getShareLink: vi.fn(async () =>
                    shareRecord({
                        viewCount: 42,
                        lastViewedAt: '2026-09-21T01:00:00.000Z',
                        minorPolicyIsMinor: false,
                        minorPolicyResolved: true,
                        minorPolicyViewCountingEnabled: true,
                    })
                ),
            },
            // Authoritative re-resolve now says the owner is ineligible.
            resolveViewCountingEligibility: vi.fn(async () => false),
        });

        const result = await makeCaller(dependencies).get({ id: SHARE_ID });

        expect(result.status).toBe('found');
        if (result.status !== 'found') throw new Error('unreachable');
        expect(result.share).not.toHaveProperty('viewCount');
        expect(result.share.lastViewedAt).toBeNull();
    });

    it('reports completed with the authoritative stopped share status on revoke', async () => {
        const caller = makeCaller(makeDependencies());

        const result = await caller.revoke({ id: SHARE_ID });

        expect(result.status).toBe('completed');
        if (result.status !== 'completed') throw new Error('unreachable');
        expect(result.share.status).toBe('stopped');
        expect(result.share.stoppedAt).toBe('2026-09-21T00:00:00.000Z');
    });

    it('rejects unknown fields strictly', async () => {
        const dependencies = makeDependencies();
        const caller = makeCaller(dependencies);

        await expect(
            caller.create({ ...createInput(), unexpected: true } as never)
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(dependencies.coordinator.createShareLink).not.toHaveBeenCalled();
    });

    it('rejects a complete request over 1 MiB on the raw input', async () => {
        const dependencies = makeDependencies();
        const caller = makeCaller(dependencies);

        await expect(
            caller.create({ ...createInput(), padding: 'x'.repeat(1_100_000) } as never)
        ).rejects.toMatchObject({
            code: 'PAYLOAD_TOO_LARGE',
            message: expect.stringContaining('1 MiB'),
        });
        expect(dependencies.coordinator.createShareLink).not.toHaveBeenCalled();
    });

    it('maps coordinator failures to fixed sanitized codes and text', async () => {
        const dependencies = makeDependencies({
            coordinator: {
                createShareLink: vi.fn(async () => {
                    throw new ShareLinkCoordinatorError('LEASE_EXPIRED', 'raw secret lease detail');
                }),
            },
        });
        const caller = makeCaller(dependencies);

        await expect(caller.create(createInput())).rejects.toMatchObject({
            code: 'CONFLICT',
            message: 'share-link state conflict',
        });

        try {
            await caller.create(createInput());
        } catch (error) {
            expect(JSON.stringify(error)).not.toContain('raw secret lease detail');
        }
    });

    it('propagates an exhausted rate limit without calling the coordinator', async () => {
        const dependencies = makeDependencies({
            enforceOwnerWriteRateLimit: vi.fn(async () => {
                throw new Error('rate limit exceeded');
            }),
        });
        const caller = makeCaller(dependencies);

        await expect(caller.create(createInput())).rejects.toThrow('rate limit exceeded');
        expect(dependencies.coordinator.createShareLink).not.toHaveBeenCalled();
    });

    it('retries a failed lazy initialization on the next request', async () => {
        const dependencies = makeDependencies();
        let initialized = false;
        const router = createShareLinksRouter(async () => {
            if (!initialized) {
                initialized = true;
                throw new Error('raw initialization secret');
            }
            return dependencies;
        });
        const caller = router.createCaller({
            domain: 'network.example.com',
            tenant: { id: 'default' },
            user: authenticatedUser,
        } as never);

        await expect(caller.create(createInput())).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'share-link service is unavailable',
        });

        await expect(caller.create(createInput())).resolves.toMatchObject({
            status: 'completed',
        });
    });

    it('returns the owner recovery JWE and nothing else', async () => {
        const caller = makeCaller(makeDependencies());

        await expect(caller.getRecovery({ id: SHARE_ID })).resolves.toEqual({ recovery });
    });
    it('fails closed on a malformed stored recovery', async () => {
        const dependencies = makeDependencies({
            coordinator: {
                readOwnerRecovery: vi.fn(async () => ({
                    ok: true as const,
                    value: { ownerEncryptedRecovery: {} },
                })),
            },
        });
        const caller = makeCaller(dependencies);

        await expect(caller.getRecovery({ id: SHARE_ID })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('retries only persisted-key recovery and maps its outcomes', async () => {
        const dependencies = makeDependencies();
        const caller = makeCaller(dependencies);

        recoveryRunner.recoverShareLinkOperation.mockResolvedValueOnce({
            status: 'committed',
            share: shareRecord(),
        });
        await expect(
            caller.retry({ id: SHARE_ID, operationId: OPERATION_ID })
        ).resolves.toMatchObject({ status: 'found' });

        recoveryRunner.recoverShareLinkOperation.mockResolvedValueOnce({ status: 'abandoned' });
        await expect(
            caller.retry({ id: SHARE_ID, operationId: OPERATION_ID })
        ).resolves.toMatchObject({ status: 'not_found' });

        expect(recoveryRunner.recoverShareLinkOperation).toHaveBeenCalledWith(
            dependencies.recovery,
            {
                namespace: NAME,
                ownerProfileId: OWNER_PROFILE.profileId,
                shareId: SHARE_ID,
                operationId: OPERATION_ID,
            }
        );
    });

    describe('list', () => {
        const emptyPage = { records: [], hasMore: false, nextCursor: null };

        it('answers NOT_FOUND when configuration is disabled', async () => {
            const caller = makeCaller(null);

            await expect(caller.list({ limit: 25 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('rejects a write-scope-only caller before listing', async () => {
            const listShareLinks = vi.fn(async () => emptyPage);
            const caller = makeCaller(makeDependencies({ listShareLinks }), {
                user: { ...authenticatedUser, scope: AUTH_GRANT_SHARE_LINKS_WRITE_SCOPE },
            });

            await expect(caller.list({ limit: 25 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            expect(listShareLinks).not.toHaveBeenCalled();
        });

        it('passes only trusted namespace/owner and the default limit', async () => {
            const listShareLinks = vi.fn(async () => ({
                records: [shareRecord()],
                hasMore: false,
                nextCursor: null,
            }));
            const caller = makeCaller(makeDependencies({ listShareLinks }));

            const result = await caller.list({ limit: 10 });

            expect(listShareLinks).toHaveBeenCalledWith({
                namespace: NAME,
                ownerProfileId: OWNER_PROFILE.profileId,
                limit: 10,
                cursor: null,
            });
            expect(result.records).toHaveLength(1);
        });

        it('decodes a canonical cursor into exactly the ordering fields', async () => {
            const listShareLinks = vi.fn(async () => emptyPage);
            const caller = makeCaller(makeDependencies({ listShareLinks }));
            const cursor = encodeShareLinkListCursor({
                createdAt: '2026-09-20T00:00:00.000Z',
                id: SHARE_ID,
            });

            await caller.list({ limit: 25, cursor });

            expect(listShareLinks).toHaveBeenCalledWith({
                namespace: NAME,
                ownerProfileId: OWNER_PROFILE.profileId,
                limit: 25,
                cursor: { createdAt: '2026-09-20T00:00:00.000Z', id: SHARE_ID },
            });
        });

        it('rejects malformed/foreign-version/invalid-field cursors with one fixed safe error', async () => {
            const listShareLinks = vi.fn(async () => emptyPage);
            const caller = makeCaller(makeDependencies({ listShareLinks }));

            const malformed = [
                'not-a-cursor',
                'v2.abc',
                'v1.@@@',
                encodeShareLinkListCursor({ createdAt: 'not-a-date', id: SHARE_ID }),
                encodeShareLinkListCursor({ createdAt: '2026-09-20T00:00:00.000Z', id: 'short' }),
            ];

            for (const cursor of malformed) {
                await expect(caller.list({ limit: 25, cursor })).rejects.toMatchObject({
                    code: 'BAD_REQUEST',
                    message: 'invalid share-link cursor',
                });
            }

            expect(listShareLinks).not.toHaveBeenCalled();
        });

        it('rejects an oversized raw cursor at the input validator', async () => {
            const listShareLinks = vi.fn(async () => emptyPage);
            const caller = makeCaller(makeDependencies({ listShareLinks }));

            await expect(
                caller.list({ limit: 25, cursor: `v1.${'A'.repeat(600)}` })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect(listShareLinks).not.toHaveBeenCalled();
        });

        it('returns the opaque next cursor and hasMore unchanged', async () => {
            const nextCursor = encodeShareLinkListCursor({
                createdAt: '2026-09-19T00:00:00.000Z',
                id: SHARE_ID,
            });
            const listShareLinks = vi.fn(async () => ({
                records: [shareRecord()],
                hasMore: true,
                nextCursor,
            }));
            const caller = makeCaller(makeDependencies({ listShareLinks }));

            await expect(caller.list({ limit: 1 })).resolves.toMatchObject({
                hasMore: true,
                cursor: nextCursor,
            });
        });

        it('projects only safe owner fields and suppresses counts for an ineligible owner', async () => {
            const eligibleButNowDenied = shareRecord({
                viewCount: 42,
                lastViewedAt: '2026-09-21T01:00:00.000Z',
                minorPolicyIsMinor: false,
                minorPolicyResolved: true,
                minorPolicyViewCountingEnabled: true,
            });
            const listShareLinks = vi.fn(async () => ({
                records: [eligibleButNowDenied],
                hasMore: false,
                nextCursor: null,
            }));
            const resolveViewCountingEligibility = vi.fn(async () => false);
            const caller = makeCaller(
                makeDependencies({ listShareLinks, resolveViewCountingEligibility })
            );

            const result = await caller.list({ limit: 25 });
            const record = result.records[0];

            expect(resolveViewCountingEligibility).toHaveBeenCalledTimes(1);
            expect(record).not.toHaveProperty('activeObjectRef');
            expect(record).not.toHaveProperty('activeContentHash');
            expect(record).not.toHaveProperty('lastOperationId');
            expect(record).not.toHaveProperty('viewCount');
            expect(record.lastViewedAt).toBeNull();
        });

        it('suppresses counts fail-closed when the eligibility resolver throws', async () => {
            const listShareLinks = vi.fn(async () => ({
                records: [
                    shareRecord({
                        viewCount: 7,
                        lastViewedAt: '2026-09-21T01:00:00.000Z',
                    }),
                ],
                hasMore: false,
                nextCursor: null,
            }));
            const resolveViewCountingEligibility = vi.fn(async () => {
                throw new Error('raw policy secret');
            });
            const caller = makeCaller(
                makeDependencies({ listShareLinks, resolveViewCountingEligibility })
            );

            const result = await caller.list({ limit: 25 });

            expect(result.records[0]).not.toHaveProperty('viewCount');
            expect(result.records[0].lastViewedAt).toBeNull();
        });

        it('maps a repository failure to a fixed safe error without leaking the cause', async () => {
            const listShareLinks = vi.fn(async () => {
                throw new Error('raw secret graph detail');
            });
            const caller = makeCaller(makeDependencies({ listShareLinks }));

            await expect(caller.list({ limit: 25 })).rejects.toMatchObject({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'share-link list is unavailable',
            });

            try {
                await caller.list({ limit: 25 });
            } catch (error) {
                expect(JSON.stringify(error)).not.toContain('raw secret graph detail');
            }
        });
    });
});

describe('enforceOwnerShareWriteRateLimit', () => {
    it('uses a 60-per-hour per-owner/namespace key and fails closed on dependency errors', async () => {
        await enforceOwnerShareWriteRateLimit(NAME, OWNER_PROFILE.profileId);

        expect(rateLimits.enforceRateLimits).toHaveBeenCalledWith([
            expect.objectContaining({
                key: `share-link-owner-write:${NAME}:${OWNER_PROFILE.profileId}`,
                limit: 60,
                windowSeconds: 3600,
            }),
        ]);

        rateLimits.enforceRateLimits.mockRejectedValueOnce(new Error('cache unavailable'));
        await expect(
            enforceOwnerShareWriteRateLimit(NAME, OWNER_PROFILE.profileId)
        ).rejects.toThrow('cache unavailable');
    });
});
