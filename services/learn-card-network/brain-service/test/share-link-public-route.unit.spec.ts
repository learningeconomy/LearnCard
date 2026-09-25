import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ShareLinkPolicyResolver } from '@helpers/share-link-policy/types';
import type { ShareLinkRecord } from '../src/models/ShareLink';
import type {
    PublicShareLinkRouterDependencies,
    PublicShareLinkSharer,
} from '../src/routes/public-share-links';

/**
 * LC-2187 public share-link route-boundary tests.
 *
 * These exercise the REAL anonymous tRPC procedure chain (`openRouteWithoutInputCapture`:
 * no did/challenge/profile middleware) with only the Sentry transport and the
 * backing repository/receipts/remote fetch faked. No protected procedure replaces
 * the public base and no backing service is real here.
 */

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
    getProfileByDid: vi.fn(async () => null),
    getProfileByProfileId: vi.fn(async () => null),
}));

const rateLimits = vi.hoisted(() => ({ enforceRateLimits: vi.fn(async () => undefined) }));
vi.mock('@helpers/rateLimit.helpers', () => ({
    enforceRateLimits: rateLimits.enforceRateLimits,
}));

import {
    createPublicShareLinksRouter,
    publicShareContentUrl,
} from '../src/routes/public-share-links';

const NAME = 'deployment-ns';
const SHARE_ID = Buffer.alloc(16, 7).toString('base64url');
const OPERATION_ID = '0f5a2c1e-1c2b-4c3d-8e4f-5a6b7c8d9e0f';
const RECEIPT = Buffer.alloc(32, 9).toString('base64url');

const envelope = {
    v: 1 as const,
    alg: 'A256GCM' as const,
    iv: Buffer.alloc(12, 1).toString('base64url'),
    ct: Buffer.alloc(32, 2).toString('base64url'),
};

const shareRecord = (overrides: Partial<ShareLinkRecord> = {}): ShareLinkRecord => ({
    id: SHARE_ID,
    namespace: NAME,
    ownerProfileId: 'owner-1',
    version: 3,
    contentVersion: 2,
    generation: 4,
    status: 'active',
    contentState: 'finalized',
    activeObjectRef: 'internal-object-ref',
    activeObjectOperationId: OPERATION_ID,
    activeContentHash: 'internal-content-hash',
    activeContentBytes: 123,
    activeRecoveryHash: 'internal-recovery-hash',
    lastOperationId: OPERATION_ID,
    createdByClientRequestId: 'client-request-id',
    title: 'Shared credentials',
    note: 'hello',
    selectedCount: 2,
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

const contentProjection = (record: ShareLinkRecord) => ({
    kind: 'active' as const,
    namespace: NAME,
    ownerProfileId: record.ownerProfileId,
    shareId: record.id,
    contentVersion: record.contentVersion,
    objectId: record.activeObjectRef as string,
    operationId: record.activeObjectOperationId as string,
    contentHash: 'tuple-inclusive-content-hash',
    payloadHash: record.activeContentHash as string,
    envelope,
    ciphertextBytes: 32,
    createdAt: '2026-09-20T00:00:00.000Z',
});

const eligiblePolicy: ShareLinkPolicyResolver = {
    resolve: vi.fn(async () => ({
        isMinor: false,
        policyResolved: true,
        defaultExpiryDays: 365 as const,
        viewCountingEnabled: true,
    })),
};

const ineligiblePolicy: ShareLinkPolicyResolver = {
    resolve: vi.fn(async () => ({
        isMinor: null,
        policyResolved: false,
        defaultExpiryDays: 30 as const,
        viewCountingEnabled: false,
    })),
};

const sharer: PublicShareLinkSharer = { displayName: 'Owner One', avatar: 'https://img/x' };

const makeDependencies = (
    overrides: {
        getShareLink?: (input: {
            shareId: string;
            namespace?: string;
        }) => Promise<ShareLinkRecord | null>;
        fetchContent?: PublicShareLinkRouterDependencies['repository']['fetchContent'];
        policyResolver?: ShareLinkPolicyResolver;
        persist?: PublicShareLinkRouterDependencies['receipts']['persist'];
        lookupOwner?: PublicShareLinkRouterDependencies['receipts']['lookupOwner'];
        lookupContext?: NonNullable<PublicShareLinkRouterDependencies['receipts']['lookupContext']>;
        consume?: PublicShareLinkRouterDependencies['receipts']['consume'];
        verifyPasscode?: NonNullable<PublicShareLinkRouterDependencies['verifyPasscode']>;
        passcodeAttempts?: NonNullable<PublicShareLinkRouterDependencies['passcodeAttempts']>;
        notifyView?: NonNullable<PublicShareLinkRouterDependencies['notifyView']>;
        getSharer?: (ownerProfileId: string) => Promise<PublicShareLinkSharer | null>;
        enforceRateLimit?: PublicShareLinkRouterDependencies['enforceRateLimit'];
        newReceipt?: () => string;
    } = {}
): PublicShareLinkRouterDependencies => {
    const record = shareRecord();
    const base: PublicShareLinkRouterDependencies = {
        namespace: NAME,
        repository: {
            getShareLink: vi.fn(async () => record),
            fetchContent: vi.fn(async () => ({
                ok: true as const,
                value: contentProjection(record),
            })),
        },
        receipts: {
            persist: vi.fn(async () => true),
            lookupOwner: vi.fn(async () => 'owner-1'),
            consume: vi.fn(async () => 'consumed' as const),
        },
        policyResolver: ineligiblePolicy,
        getSharer: vi.fn(async () => sharer),
        passcodeAttempts: {
            canAttempt: vi.fn(async () => true),
            recordFailure: vi.fn(async () => undefined),
        },
        enforceRateLimit: vi.fn(async () => undefined),
        contentUrlFor: (shareId: string) => `/share-links/${shareId}/content`,
        newReceipt: () => RECEIPT,
        now: () => new Date('2026-09-21T00:00:00.000Z'),
        reportFailure: vi.fn(),
    };

    return {
        ...base,
        ...overrides,
        repository: {
            ...base.repository,
            ...(overrides.getShareLink ? { getShareLink: overrides.getShareLink } : {}),
            ...(overrides.fetchContent ? { fetchContent: overrides.fetchContent } : {}),
        },
        receipts: {
            ...base.receipts,
            ...(overrides.persist ? { persist: overrides.persist } : {}),
            ...(overrides.lookupOwner ? { lookupOwner: overrides.lookupOwner } : {}),
            ...(overrides.lookupContext ? { lookupContext: overrides.lookupContext } : {}),
            ...(overrides.consume ? { consume: overrides.consume } : {}),
        },
        ...(overrides.policyResolver ? { policyResolver: overrides.policyResolver } : {}),
        ...(overrides.getSharer ? { getSharer: overrides.getSharer } : {}),
        ...(overrides.enforceRateLimit ? { enforceRateLimit: overrides.enforceRateLimit } : {}),
        ...(overrides.newReceipt ? { newReceipt: overrides.newReceipt } : {}),
        ...(overrides.verifyPasscode ? { verifyPasscode: overrides.verifyPasscode } : {}),
        ...(overrides.passcodeAttempts ? { passcodeAttempts: overrides.passcodeAttempts } : {}),
        ...(overrides.notifyView ? { notifyView: overrides.notifyView } : {}),
    };
};

const makeCaller = (
    dependencies: PublicShareLinkRouterDependencies | null,
    options: { getDependenciesError?: Error; sourceIp?: string } = {}
) => {
    const router = createPublicShareLinksRouter(async () => {
        if (options.getDependenciesError) throw options.getDependenciesError;
        return dependencies;
    });

    return router.createCaller({
        domain: 'network.example.com',
        tenant: { id: 'default' },
        sourceIp: options.sourceIp ?? '203.0.113.7',
    } as never);
};

beforeEach(() => {
    rateLimits.enforceRateLimits.mockReset();
    rateLimits.enforceRateLimits.mockResolvedValue(undefined);
});

describe('public share-link resolve', () => {
    it('answers not_found and calls nothing when configuration is disabled', async () => {
        const dependencies = makeDependencies();
        await expect(makeCaller(null).resolve({ id: SHARE_ID })).resolves.toEqual({
            state: 'not_found',
            id: SHARE_ID,
        });
        expect(dependencies.repository.getShareLink).not.toHaveBeenCalled();
        expect(dependencies.receipts.persist).not.toHaveBeenCalled();
    });

    it('answers not_found (never throws) when lazy initialization fails', async () => {
        await expect(
            makeCaller(makeDependencies(), {
                getDependenciesError: new Error('raw secret'),
            }).resolve({ id: SHARE_ID })
        ).resolves.toEqual({ state: 'not_found', id: SHARE_ID });
    });

    it('works anonymously and returns only the strict public metadata projection', async () => {
        const caller = makeCaller(makeDependencies());

        const result = await caller.resolve({ id: SHARE_ID });

        expect(result).toEqual({
            state: 'active',
            id: SHARE_ID,
            title: 'Shared credentials',
            note: 'hello',
            selectedCount: 2,
            contentVersion: 2,
            contentUrl: `/share-links/${SHARE_ID}/content`,
            sharer,
            createdAt: '2026-09-20T00:00:00.000Z',
            updatedAt: '2026-09-20T00:00:00.000Z',
            expiresAt: null,
        });
        expect(result).not.toHaveProperty('ownerProfileId');
        expect(result).not.toHaveProperty('namespace');
        expect(result).not.toHaveProperty('activeObjectRef');
        expect(result).not.toHaveProperty('viewCount');
        expect(result).not.toHaveProperty('minorPolicy');
    });

    it('never creates a receipt or a count on resolve', async () => {
        const dependencies = makeDependencies({ policyResolver: eligiblePolicy });
        await makeCaller(dependencies).resolve({ id: SHARE_ID });

        expect(dependencies.receipts.persist).not.toHaveBeenCalled();
        expect(dependencies.receipts.consume).not.toHaveBeenCalled();
    });

    it('requires and verifies a passcode without exposing the stored hash', async () => {
        const verifyPasscode = vi.fn(
            async (_hash: string, passcode: string) => passcode === '2468'
        );
        const dependencies = makeDependencies({
            getShareLink: async () => shareRecord({ passcodeHash: '$argon2id$stored' }),
            verifyPasscode,
        });
        const caller = makeCaller(dependencies);

        await expect(caller.resolve({ id: SHARE_ID })).resolves.toEqual({
            state: 'passcode_required',
            id: SHARE_ID,
        });
        await expect(caller.resolve({ id: SHARE_ID, passcode: '1111' })).resolves.toEqual({
            state: 'passcode_required',
            id: SHARE_ID,
        });
        await expect(caller.resolve({ id: SHARE_ID, passcode: '2468' })).resolves.toMatchObject({
            state: 'active',
            id: SHARE_ID,
        });
        expect(verifyPasscode).toHaveBeenCalledWith('$argon2id$stored', '2468');
    });

    it('skips Argon2 for unprotected shares', async () => {
        const verifyPasscode = vi.fn(async () => false);
        const dependencies = makeDependencies({ verifyPasscode });
        await expect(makeCaller(dependencies).resolve({ id: SHARE_ID })).resolves.toMatchObject({
            state: 'active',
        });
        await expect(makeCaller(dependencies).content({ id: SHARE_ID })).resolves.toHaveProperty(
            'envelope'
        );
        expect(verifyPasscode).not.toHaveBeenCalled();
    });

    it('requires a passcode before revealing protected lifecycle state', async () => {
        const verifyPasscode = vi.fn(async (_hash: string, value: string) => value === '2468');
        for (const record of [
            shareRecord({ passcodeHash: 'stored' }),
            shareRecord({ passcodeHash: 'stored', expiresAt: '2026-09-20T00:00:00.000Z' }),
            shareRecord({
                passcodeHash: 'stored',
                status: 'stopped',
                stoppedAt: '2026-09-20T00:00:00.000Z',
            }),
        ]) {
            const caller = makeCaller(
                makeDependencies({ getShareLink: async () => record, verifyPasscode })
            );
            await expect(caller.resolve({ id: SHARE_ID })).resolves.toEqual({
                state: 'passcode_required',
                id: SHARE_ID,
            });
            await expect(caller.resolve({ id: SHARE_ID, passcode: 'wrong' })).resolves.toEqual({
                state: 'passcode_required',
                id: SHARE_ID,
            });
            await expect(caller.resolve({ id: SHARE_ID, passcode: '2468' })).resolves.toMatchObject(
                {
                    state:
                        record.status === 'stopped'
                            ? 'stopped'
                            : record.expiresAt
                              ? 'expired'
                              : 'active',
                }
            );
        }
        const missing = makeCaller(
            makeDependencies({ getShareLink: async () => null, verifyPasscode })
        );
        verifyPasscode.mockClear();
        await expect(missing.resolve({ id: SHARE_ID, passcode: '2468' })).resolves.toEqual({
            state: 'not_found',
            id: SHARE_ID,
        });
        expect(verifyPasscode).not.toHaveBeenCalled();
    });

    it('shares the failed-attempt budget across source addresses and both endpoints', async () => {
        let failures = 0;
        const passcodeAttempts = {
            canAttempt: vi.fn(async () => failures < 2),
            recordFailure: vi.fn(async () => {
                failures += 1;
            }),
        };
        const verifyPasscode = vi.fn(async (_hash: string, value: string) => value === '2468');
        const dependencies = makeDependencies({
            getShareLink: async () => shareRecord({ passcodeHash: 'stored' }),
            passcodeAttempts,
            verifyPasscode,
        });
        await makeCaller(dependencies, { sourceIp: '203.0.113.1' }).resolve({
            id: SHARE_ID,
            passcode: 'wrong',
        });
        await expect(
            makeCaller(dependencies, { sourceIp: '203.0.113.2' }).content({
                id: SHARE_ID,
                passcode: 'wrong',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        await expect(
            makeCaller(dependencies, { sourceIp: '203.0.113.3' }).resolve({
                id: SHARE_ID,
                passcode: '2468',
            })
        ).resolves.toEqual({ state: 'passcode_required', id: SHARE_ID });
        expect(verifyPasscode).toHaveBeenCalledTimes(2);
        failures = 0; // the short window has elapsed
        await expect(
            makeCaller(dependencies).resolve({ id: SHARE_ID, passcode: '2468' })
        ).resolves.toMatchObject({ state: 'active' });
    });

    it('reports stopped and expired without exposing internals', async () => {
        const stopped = makeDependencies({
            getShareLink: async () =>
                shareRecord({ status: 'stopped', stoppedAt: '2026-09-21T01:00:00.000Z' }),
        });
        await expect(makeCaller(stopped).resolve({ id: SHARE_ID })).resolves.toEqual({
            state: 'stopped',
            id: SHARE_ID,
            stoppedAt: '2026-09-21T01:00:00.000Z',
        });

        const expired = makeDependencies({
            getShareLink: async () => shareRecord({ expiresAt: '2026-09-20T00:00:00.000Z' }),
        });
        await expect(makeCaller(expired).resolve({ id: SHARE_ID })).resolves.toEqual({
            state: 'expired',
            id: SHARE_ID,
            expiresAt: '2026-09-20T00:00:00.000Z',
        });
    });

    it.each(['staging', 'content_missing'] as const)(
        'fails closed to not_found for contentState %s',
        async state => {
            const dependencies = makeDependencies({
                getShareLink: async () => shareRecord({ contentState: state, status: 'pending' }),
            });
            await expect(makeCaller(dependencies).resolve({ id: SHARE_ID })).resolves.toEqual({
                state: 'not_found',
                id: SHARE_ID,
            });
        }
    );

    it('rejects unknown fields strictly and uses a share-id-free rate-limit key', async () => {
        const dependencies = makeDependencies();
        const caller = makeCaller(dependencies);

        await expect(caller.resolve({ id: SHARE_ID, extra: 1 } as never)).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
        expect(dependencies.repository.getShareLink).not.toHaveBeenCalled();

        await caller.resolve({ id: SHARE_ID });
        const [window] = (dependencies.enforceRateLimit as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(window.key).toBe(`share-link-public-resolve:${NAME}:203.0.113.7`);
        expect(window.key).not.toContain(SHARE_ID);
    });

    it('fails closed on a rate-limit dependency error', async () => {
        await expect(
            makeCaller(
                makeDependencies({
                    enforceRateLimit: vi.fn(async () => {
                        throw new Error('cache down');
                    }),
                })
            ).resolve({ id: SHARE_ID })
        ).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    });

    it('fails closed when the metadata revision changes during the awaited sharer lookup', async () => {
        let reads = 0;
        const dependencies = makeDependencies({
            getShareLink: async () => {
                reads += 1;
                return reads === 1 ? shareRecord() : shareRecord({ version: 4 });
            },
        });

        await expect(makeCaller(dependencies).resolve({ id: SHARE_ID })).resolves.toEqual({
            state: 'not_found',
            id: SHARE_ID,
        });
    });

    it('fails closed (never leaks a raw message) when the repository throws', async () => {
        const dependencies = makeDependencies({
            getShareLink: async () => {
                throw new Error('raw graph secret');
            },
        });

        await expect(makeCaller(dependencies).resolve({ id: SHARE_ID })).resolves.toEqual({
            state: 'not_found',
            id: SHARE_ID,
        });
    });
});

describe('public share-link content', () => {
    it('enforces the passcode before fetching protected content', async () => {
        const fetchContent = vi.fn(async () => ({
            ok: true as const,
            value: contentProjection(shareRecord()),
        }));
        const dependencies = makeDependencies({
            getShareLink: async () => shareRecord({ passcodeHash: '$argon2id$stored' }),
            fetchContent,
            verifyPasscode: async (_hash, passcode) => passcode === '2468',
        });
        const caller = makeCaller(dependencies);

        await expect(caller.content({ id: SHARE_ID })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        expect(fetchContent).not.toHaveBeenCalled();

        await expect(caller.content({ id: SHARE_ID, passcode: '2468' })).resolves.toMatchObject({
            id: SHARE_ID,
            envelope,
        });
    });
    it('withholds content when revoked during the awaited policy lookup', async () => {
        let revoked = false;
        const dependencies = makeDependencies({
            getShareLink: async () => shareRecord(revoked ? { status: 'stopped' } : {}),
            policyResolver: {
                resolve: async () => {
                    revoked = true;
                    return ineligiblePolicy.resolve('owner-1');
                },
            },
        });
        await expect(makeCaller(dependencies).content({ id: SHARE_ID })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('returns the validated envelope, contentVersion and an opaque receipt only', async () => {
        const dependencies = makeDependencies({
            policyResolver: eligiblePolicy,
            getShareLink: async () =>
                shareRecord({
                    minorPolicyIsMinor: false,
                    minorPolicyResolved: true,
                    minorPolicyViewCountingEnabled: true,
                }),
        });
        const result = await makeCaller(dependencies).content({ id: SHARE_ID });

        expect(result).toEqual({
            id: SHARE_ID,
            contentVersion: 2,
            envelope,
            contentUrl: `/share-links/${SHARE_ID}/content`,
            receipt: RECEIPT,
        });
        expect(result).not.toHaveProperty('objectId');
        expect(result).not.toHaveProperty('operationId');
        expect(result).not.toHaveProperty('contentHash');
        expect(dependencies.receipts.persist).toHaveBeenCalledTimes(1);
    });

    it('returns identical-shape padding and persists nothing for an ineligible owner', async () => {
        const dependencies = makeDependencies({ policyResolver: ineligiblePolicy });
        const result = await makeCaller(dependencies).content({ id: SHARE_ID });

        expect(result.receipt).toBe(RECEIPT);
        expect(result.receipt).toHaveLength(43);
        expect(dependencies.receipts.persist).not.toHaveBeenCalled();
    });

    it('fails closed when the committed policy is disabled even if policy now permits', async () => {
        const dependencies = makeDependencies({
            policyResolver: eligiblePolicy,
            getShareLink: async () => shareRecord({ minorPolicyViewCountingEnabled: false }),
        });

        await makeCaller(dependencies).content({ id: SHARE_ID });

        expect(dependencies.receipts.persist).not.toHaveBeenCalled();
    });

    it('withholds bytes when the share is revoked between fetch and the final recheck', async () => {
        let reads = 0;
        const dependencies = makeDependencies({
            policyResolver: eligiblePolicy,
            getShareLink: async () => {
                reads += 1;
                return reads === 1
                    ? shareRecord()
                    : shareRecord({ status: 'stopped', stoppedAt: '2026-09-21T00:00:01.000Z' });
            },
        });

        await expect(makeCaller(dependencies).content({ id: SHARE_ID })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
        expect(dependencies.receipts.persist).not.toHaveBeenCalled();
    });

    it('withholds bytes when the content version is replaced during the remote read', async () => {
        let reads = 0;
        const dependencies = makeDependencies({
            policyResolver: eligiblePolicy,
            getShareLink: async () => {
                reads += 1;
                return reads === 1
                    ? shareRecord()
                    : shareRecord({
                          version: 4,
                          contentVersion: 3,
                          activeObjectRef: 'new-object-ref',
                          activeObjectOperationId: 'new-operation-id',
                      });
            },
        });

        await expect(makeCaller(dependencies).content({ id: SHARE_ID })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('answers not_found when disabled, without repository calls', async () => {
        const dependencies = makeDependencies();
        await expect(makeCaller(null).content({ id: SHARE_ID })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
        expect(dependencies.repository.fetchContent).not.toHaveBeenCalled();
    });

    it('maps an unavailable remote read to a fixed service-unavailable error', async () => {
        const dependencies = makeDependencies({
            fetchContent: async () => ({ ok: false as const, error: 'UNAVAILABLE' }),
        });

        await expect(makeCaller(dependencies).content({ id: SHARE_ID })).rejects.toMatchObject({
            code: 'SERVICE_UNAVAILABLE',
        });
    });

    it('withholds content when revoked during receipt persistence, after all awaited work', async () => {
        let revoked = false;
        const enabled = {
            minorPolicyIsMinor: false,
            minorPolicyResolved: true,
            minorPolicyViewCountingEnabled: true,
        };
        const dependencies = makeDependencies({
            policyResolver: eligiblePolicy,
            getShareLink: async () =>
                revoked
                    ? shareRecord({ status: 'stopped', stoppedAt: '2026-09-21T00:00:01.000Z' })
                    : shareRecord(enabled),
            persist: vi.fn(async () => {
                revoked = true;
                return true;
            }),
        });

        await expect(makeCaller(dependencies).content({ id: SHARE_ID })).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('mounts the returned content URL under the deployed /api base path', () => {
        expect(publicShareContentUrl(SHARE_ID)).toBe(`/api/public/share-links/${SHARE_ID}/content`);
        expect(publicShareContentUrl('a/b?c')).toBe('/api/public/share-links/a%2Fb%3Fc/content');
    });
});

describe('public share-link acknowledgeView', () => {
    it('sends an opted-in adult notification with count and time only', async () => {
        const notifyView = vi.fn(async () => undefined);
        const viewedAt = '2026-09-21T00:00:02.000Z';
        const dependencies = makeDependencies({
            policyResolver: eligiblePolicy,
            lookupContext: vi.fn(async () => ({ ownerProfileId: 'owner-1', shareId: SHARE_ID })),
            getShareLink: async () =>
                shareRecord({
                    notifyOnView: true,
                    viewCount: 4,
                    lastViewedAt: viewedAt,
                    minorPolicyIsMinor: false,
                    minorPolicyResolved: true,
                    minorPolicyViewCountingEnabled: true,
                }),
            notifyView,
        });

        await makeCaller(dependencies).acknowledgeView({ receipt: RECEIPT });

        expect(notifyView).toHaveBeenCalledWith({
            shareId: SHARE_ID,
            ownerProfileId: 'owner-1',
            title: 'Shared credentials',
            selectedCount: 2,
            viewCount: 4,
            viewedAt,
        });
        expect(notifyView.mock.calls[0][0]).not.toHaveProperty('ip');
        expect(notifyView.mock.calls[0][0]).not.toHaveProperty('device');
        expect(notifyView.mock.calls[0][0]).not.toHaveProperty('location');
    });
    it('always returns the uniform { ok: true } and never exposes eligibility', async () => {
        const consumed = makeDependencies({ consume: vi.fn(async () => 'consumed') });
        await expect(makeCaller(consumed).acknowledgeView({ receipt: RECEIPT })).resolves.toEqual({
            ok: true,
        });

        const ineligible = makeDependencies({ consume: vi.fn(async () => 'ineligible') });
        await expect(makeCaller(ineligible).acknowledgeView({ receipt: RECEIPT })).resolves.toEqual(
            { ok: true }
        );

        const unknown = makeDependencies({ lookupOwner: vi.fn(async () => null) });
        await expect(makeCaller(unknown).acknowledgeView({ receipt: RECEIPT })).resolves.toEqual({
            ok: true,
        });
        expect(unknown.receipts.consume).not.toHaveBeenCalled();
    });

    it('stays uniform when disabled, rate-limited or when the receipt dependency fails', async () => {
        await expect(makeCaller(null).acknowledgeView({ receipt: RECEIPT })).resolves.toEqual({
            ok: true,
        });

        const limited = makeDependencies({
            enforceRateLimit: vi.fn(async () => {
                throw new Error('cache down');
            }),
        });
        await expect(makeCaller(limited).acknowledgeView({ receipt: RECEIPT })).resolves.toEqual({
            ok: true,
        });
        expect(limited.receipts.consume).not.toHaveBeenCalled();

        const failing = makeDependencies({
            consume: vi.fn(async () => {
                throw new Error('graph down');
            }),
        });
        await expect(makeCaller(failing).acknowledgeView({ receipt: RECEIPT })).resolves.toEqual({
            ok: true,
        });
    });

    it('resolves authoritative policy for the receipt owner before consuming', async () => {
        const dependencies = makeDependencies({
            policyResolver: eligiblePolicy,
            lookupOwner: vi.fn(async () => 'owner-1'),
        });

        await makeCaller(dependencies).acknowledgeView({ receipt: RECEIPT });

        expect(dependencies.policyResolver.resolve).toHaveBeenCalledWith('owner-1');
        expect(dependencies.receipts.consume).toHaveBeenCalledWith({
            receipt: RECEIPT,
            namespace: NAME,
            eligibilitySource: undefined,
        });
    });

    it('passes the transaction-compatible eligibility source through to consume', async () => {
        const eligibilitySource = { isEligible: vi.fn(async () => true) };
        const dependencies = makeDependencies({
            policyResolver: eligiblePolicy,
            lookupOwner: vi.fn(async () => 'owner-1'),
        });
        const withSource = { ...dependencies, eligibilitySource };

        await makeCaller(withSource).acknowledgeView({ receipt: RECEIPT });

        expect(dependencies.receipts.consume).toHaveBeenCalledWith({
            receipt: RECEIPT,
            namespace: NAME,
            eligibilitySource,
        });
    });

    it('does not open a consume transaction when the pre-lock policy forbids counting', async () => {
        const dependencies = makeDependencies({
            policyResolver: ineligiblePolicy,
            lookupOwner: vi.fn(async () => 'owner-1'),
        });

        await makeCaller(dependencies).acknowledgeView({ receipt: RECEIPT });

        expect(dependencies.receipts.consume).not.toHaveBeenCalled();
    });

    it('rejects malformed receipts as a generic validation error', async () => {
        const dependencies = makeDependencies();
        await expect(
            makeCaller(dependencies).acknowledgeView({ receipt: 'short' } as never)
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        expect(dependencies.receipts.consume).not.toHaveBeenCalled();
    });

    it('rate-limits ack with a share-id-free key', async () => {
        const dependencies = makeDependencies();
        await makeCaller(dependencies).acknowledgeView({ receipt: RECEIPT });

        expect(dependencies.receipts.lookupOwner).toHaveBeenCalledWith(RECEIPT, NAME);

        const [window] = (dependencies.enforceRateLimit as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(window.key).toBe(`share-link-public-ack:${NAME}:203.0.113.7`);
        expect(window.key).not.toContain(RECEIPT);
    });
});
