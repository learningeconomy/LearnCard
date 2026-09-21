import { TRPCError } from '@trpc/server';

import {
    CreateShareLinkInputValidator,
    ListShareLinksInputValidator,
    PaginatedShareLinksValidator,
    ShareLinkOwnerCommitOutputValidator,
    ShareLinkOwnerRecoveryOutputValidator,
    ShareLinkOwnerStatusOutputValidator,
    ShareLinkOperationKeyInputValidator,
    ShareOwnerRecoveryValidator,
    UpdateShareLinkInputValidator,
} from '@learncard/types';

import { t, profileRouteWithoutInputCapture } from '@routes';
import {
    AUTH_GRANT_SHARE_LINKS_READ_SCOPE,
    AUTH_GRANT_SHARE_LINKS_WRITE_SCOPE,
} from 'src/constants/auth-grant';
import { enforceRateLimits } from '@helpers/rateLimit.helpers';
import { toOwnerShareLink } from '@helpers/share-link-owner-projection';
import { createRetryableLazyInitializer } from '@helpers/share-link-owner/lazy-initializer';
import { resolveShareLinkOwnerApiConfig } from '@helpers/share-link-owner/config';
import type { ShareLinkOwnerApiConfigResolution } from '@helpers/share-link-owner/config';
import { createShareLinkPolicyResolver } from '@helpers/share-link-policy/resolver';
import { ShareLinkCoordinatorError } from '@helpers/share-link-coordinator';
import type {
    RecoveryRunnerDependencies,
    ShareLinkCoordinator,
    ShareLinkCoordinatorErrorCode,
} from '@helpers/share-link-coordinator';
import { decodeShareLinkListCursor } from '@accesslayer/share-link/list';
import type {
    ListShareLinksInput,
    ListShareLinksResult,
    ShareLinkListCursor,
} from '@accesslayer/share-link/types';

/**
 * LC-2187 owner share-link APIs (D1).
 *
 * Disabled by default and fail-closed: the namespace is taken exclusively from
 * trusted server configuration (never from the caller, tenant header or Host),
 * the owner exclusively from the authenticated profile, and the default policy
 * exclusively from server-side sources. There are no public resolve/content/ack
 * routes in D1.
 */

export type ShareLinkRouterDependencies = {
    readonly namespace: string;
    readonly coordinator: ShareLinkCoordinator;
    readonly recovery: RecoveryRunnerDependencies;
    /**
     * Bounded, namespace+owner-scoped keyset listing over the immutable
     * `(createdAt, id)` key. Receives only trusted scope; the route decodes and
     * validates any caller cursor first.
     */
    readonly listShareLinks: (input: ListShareLinksInput) => Promise<ListShareLinksResult>;
    /** Per-owner create/update/revoke/retry abuse limit. */
    readonly enforceOwnerWriteRateLimit: (ownerProfileId: string) => Promise<void>;
    /**
     * Freshly re-resolve authoritative view-counting eligibility for the owner.
     * Used only to decide whether `viewCount`/`lastViewedAt` may appear in the
     * owner projection; a resolver failure fails closed to `false`.
     */
    readonly resolveViewCountingEligibility: (ownerProfileId: string) => Promise<boolean>;
};

/** Eligibility for projection: an unavailable resolver never leaks a count. */
const safeEligibility = async (
    dependencies: ShareLinkRouterDependencies,
    ownerProfileId: string
): Promise<boolean> => {
    try {
        return (await dependencies.resolveViewCountingEligibility(ownerProfileId)) === true;
    } catch {
        return false;
    }
};

function notFound(): never {
    throw new TRPCError({ code: 'NOT_FOUND' });
}

/**
 * Fixed, sanitized tRPC mapping for coordinator/repository failures.
 *
 * Raw messages, stack traces and `cause` chains from the graph/remote layer
 * must never cross the route boundary or reach telemetry. Every documented
 * coordinator code maps to one stable tRPC code and one safe message.
 */
const mapCoordinatorError = (code: ShareLinkCoordinatorErrorCode): TRPCError => {
    switch (code) {
        case 'INVALID_INPUT':
            return new TRPCError({ code: 'BAD_REQUEST', message: 'invalid share-link request' });
        case 'NOT_FOUND':
            return new TRPCError({ code: 'NOT_FOUND', message: 'share-link not found' });
        case 'CONFLICT':
        case 'OPERATION_IN_FLIGHT':
        case 'LEASE_EXPIRED':
        case 'STALE_GENERATION':
            return new TRPCError({ code: 'CONFLICT', message: 'share-link state conflict' });
        case 'PRECONDITION_FAILED':
            return new TRPCError({
                code: 'PRECONDITION_FAILED',
                message: 'share-link precondition failed',
            });
        case 'UNAUTHORIZED':
            return new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'share-link operation is not authorized',
            });
        case 'PAYLOAD_TOO_LARGE':
            return new TRPCError({
                code: 'PAYLOAD_TOO_LARGE',
                message: 'share-link payload is too large',
            });
        case 'UNAVAILABLE':
            return new TRPCError({
                code: 'SERVICE_UNAVAILABLE',
                message: 'share-link service is unavailable',
            });
        case 'SIGNING_FAILED':
        case 'UNEXPECTED':
            return new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'share-link operation failed',
            });
    }
};

/** Run a coordinator/recovery call, converting only its typed failures. */
const runCoordinated = async <T>(operation: () => Promise<T>): Promise<T> => {
    try {
        return await operation();
    } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof ShareLinkCoordinatorError) throw mapCoordinatorError(error.code);

        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'share-link operation failed',
        });
    }
};

/**
 * Complete-request byte bounding lives in the route base
 * (`openRouteWithoutInputCapture`) so it runs before authentication and before
 * Zod parsing; see `@routes`.
 */

const openapi = (method: 'GET' | 'POST', path: `/${string}`, summary: string) => ({
    protect: true as const,
    method,
    path,
    tags: ['ShareLinks'],
    summary,
});

const projectCommit = (
    result:
        | { status: 'committed' | 'replayed'; share: Parameters<typeof toOwnerShareLink>[0] }
        | { status: 'pending'; reservation: { operationId: string } },
    id: string,
    viewCountingEnabled: boolean
) =>
    result.status === 'pending'
        ? { status: 'pending' as const, id, operationId: result.reservation.operationId }
        : {
              status: 'completed' as const,
              share: toOwnerShareLink(result.share, viewCountingEnabled),
          };

/**
 * Build the owner router over injected dependencies. Route-boundary tests pass
 * fakes; production passes the lazily-built runtime.
 */
export const createShareLinksRouter = (
    getDependencies: () => Promise<ShareLinkRouterDependencies | null>
) => {
    const resolve = async (): Promise<ShareLinkRouterDependencies> => {
        let dependencies: ShareLinkRouterDependencies | null;

        try {
            dependencies = await getDependencies();
        } catch {
            // Initialization failed transiently. Never surface the raw failure;
            // the next request retries initialization.
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'share-link service is unavailable',
            });
        }

        if (!dependencies) notFound();

        return dependencies;
    };

    return t.router({
        create: profileRouteWithoutInputCapture
            .meta({
                openapi: openapi('POST', '/share-links/create', 'Create an owner share link'),
                requiredScope: AUTH_GRANT_SHARE_LINKS_WRITE_SCOPE,
            })
            .input(CreateShareLinkInputValidator)
            .output(ShareLinkOwnerCommitOutputValidator)
            .mutation(async ({ ctx, input }) => {
                const dependencies = await resolve();
                await dependencies.enforceOwnerWriteRateLimit(ctx.user.profile.profileId);

                const result = await runCoordinated(() =>
                    dependencies.coordinator.createShareLink(input, {
                        namespace: dependencies.namespace,
                        ownerProfileId: ctx.user.profile.profileId,
                    })
                );

                return projectCommit(
                    result,
                    input.id,
                    await safeEligibility(dependencies, ctx.user.profile.profileId)
                );
            }),

        update: profileRouteWithoutInputCapture
            .meta({
                openapi: openapi('POST', '/share-links/update', 'Update an owner share link'),
                requiredScope: AUTH_GRANT_SHARE_LINKS_WRITE_SCOPE,
            })
            .input(UpdateShareLinkInputValidator)
            .output(ShareLinkOwnerCommitOutputValidator)
            .mutation(async ({ ctx, input }) => {
                const dependencies = await resolve();
                await dependencies.enforceOwnerWriteRateLimit(ctx.user.profile.profileId);

                const result = await runCoordinated(() =>
                    dependencies.coordinator.updateShareLink(input, {
                        namespace: dependencies.namespace,
                        ownerProfileId: ctx.user.profile.profileId,
                    })
                );

                return projectCommit(
                    result,
                    input.id,
                    await safeEligibility(dependencies, ctx.user.profile.profileId)
                );
            }),

        revoke: profileRouteWithoutInputCapture
            .meta({
                openapi: openapi('POST', '/share-links/revoke', 'Revoke an owner share link'),
                requiredScope: AUTH_GRANT_SHARE_LINKS_WRITE_SCOPE,
            })
            .input(
                ShareLinkOperationKeyInputValidator.pick({ id: true }).extend({
                    expectedVersion: UpdateShareLinkInputValidator.shape.expectedVersion.optional(),
                    clientRequestId: CreateShareLinkInputValidator.shape.clientRequestId.optional(),
                })
            )
            .output(ShareLinkOwnerCommitOutputValidator)
            .mutation(async ({ ctx, input }) => {
                const dependencies = await resolve();
                await dependencies.enforceOwnerWriteRateLimit(ctx.user.profile.profileId);

                const result = await runCoordinated(() =>
                    dependencies.coordinator.revokeShareLink(input, {
                        namespace: dependencies.namespace,
                        ownerProfileId: ctx.user.profile.profileId,
                    })
                );

                // `completed` is the outer terminal tag; the authoritative state
                // (here `stopped`) lives on `share.status`.
                return {
                    status: 'completed' as const,
                    share: toOwnerShareLink(
                        result.share,
                        await safeEligibility(dependencies, ctx.user.profile.profileId)
                    ),
                };
            }),

        list: profileRouteWithoutInputCapture
            .meta({
                // A collection path with no trailing segment, so it can never be
                // shadowed by (or shadow) the `GET /share-links/{id}` owner route
                // or any public `/public/share-links/...` route.
                openapi: openapi('GET', '/share-links', 'List owner share links'),
                requiredScope: AUTH_GRANT_SHARE_LINKS_READ_SCOPE,
            })
            .input(ListShareLinksInputValidator)
            .output(PaginatedShareLinksValidator)
            .query(async ({ ctx, input }) => {
                const dependencies = await resolve();

                let cursor: ShareLinkListCursor | null = null;
                if (input.cursor !== undefined) {
                    cursor = decodeShareLinkListCursor(input.cursor);
                    // Malformed/oversized/impossible/foreign-version cursors fail
                    // closed with one fixed message and never reach the graph.
                    if (cursor === null) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: 'invalid share-link cursor',
                        });
                    }
                }

                let page: ListShareLinksResult;
                try {
                    page = await dependencies.listShareLinks({
                        namespace: dependencies.namespace,
                        ownerProfileId: ctx.user.profile.profileId,
                        limit: input.limit,
                        cursor,
                    });
                } catch {
                    // Fixed safe mapping: never surface a raw repository message.
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'share-link list is unavailable',
                    });
                }

                // Eligibility is re-resolved exactly once per request; a failure
                // or non-`true` answer suppresses viewCount/lastViewedAt for
                // every record (fail-closed).
                const viewCountingEnabled = await safeEligibility(
                    dependencies,
                    ctx.user.profile.profileId
                );

                return {
                    records: page.records.map(record =>
                        toOwnerShareLink(record, viewCountingEnabled)
                    ),
                    hasMore: page.hasMore,
                    ...(page.nextCursor === null ? {} : { cursor: page.nextCursor }),
                };
            }),

        get: profileRouteWithoutInputCapture
            .meta({
                openapi: openapi('GET', '/share-links/{id}', 'Get owner share-link metadata'),
                requiredScope: AUTH_GRANT_SHARE_LINKS_READ_SCOPE,
            })
            .input(ShareLinkOperationKeyInputValidator.pick({ id: true }))
            .output(ShareLinkOwnerStatusOutputValidator)
            .query(async ({ ctx, input }) => {
                const dependencies = await resolve();
                const share = await runCoordinated(() =>
                    dependencies.coordinator.getShareLink(input.id, {
                        namespace: dependencies.namespace,
                        ownerProfileId: ctx.user.profile.profileId,
                    })
                );

                return share === null
                    ? { status: 'not_found' as const, id: input.id }
                    : {
                          status: 'found' as const,
                          share: toOwnerShareLink(
                              share,
                              await safeEligibility(dependencies, ctx.user.profile.profileId)
                          ),
                      };
            }),

        getOperationStatus: profileRouteWithoutInputCapture
            .meta({
                openapi: openapi(
                    'GET',
                    '/share-links/operations/{operationId}',
                    'Get owner scoped operation status'
                ),
                requiredScope: AUTH_GRANT_SHARE_LINKS_READ_SCOPE,
            })
            .input(ShareLinkOperationKeyInputValidator)
            .output(ShareLinkOwnerStatusOutputValidator)
            .query(async ({ ctx, input }) => {
                const dependencies = await resolve();
                const target = await runCoordinated(() =>
                    dependencies.recovery.repository.readShareLinkRecoveryTarget({
                        namespace: dependencies.namespace,
                        ownerProfileId: ctx.user.profile.profileId,
                        shareId: input.id,
                        operationId: input.operationId,
                    })
                );

                if (target.state === 'committed') {
                    return {
                        status: 'found' as const,
                        share: toOwnerShareLink(
                            target.share,
                            await safeEligibility(dependencies, ctx.user.profile.profileId)
                        ),
                    };
                }
                if (target.state === 'reservation') {
                    return {
                        status: 'pending' as const,
                        id: input.id,
                        operationId: input.operationId,
                    };
                }

                return { status: 'not_found' as const, id: input.id };
            }),

        retry: profileRouteWithoutInputCapture
            .meta({
                openapi: openapi('POST', '/share-links/retry', 'Retry an owner operation'),
                requiredScope: AUTH_GRANT_SHARE_LINKS_WRITE_SCOPE,
            })
            .input(ShareLinkOperationKeyInputValidator)
            .output(ShareLinkOwnerStatusOutputValidator)
            .mutation(async ({ ctx, input }) => {
                const dependencies = await resolve();
                await dependencies.enforceOwnerWriteRateLimit(ctx.user.profile.profileId);

                // Persisted-key recovery only: the server re-derives the immutable
                // object/lease/generation bindings from durable Brain state. A
                // caller-supplied descriptor is never accepted.
                const result = await runCoordinated(async () => {
                    const { recoverShareLinkOperation } =
                        await import('@helpers/share-link-coordinator/recovery-runner');

                    return recoverShareLinkOperation(dependencies.recovery, {
                        namespace: dependencies.namespace,
                        ownerProfileId: ctx.user.profile.profileId,
                        shareId: input.id,
                        operationId: input.operationId,
                    });
                });

                if (result.status === 'committed') {
                    return {
                        status: 'found' as const,
                        share: toOwnerShareLink(
                            result.share,
                            await safeEligibility(dependencies, ctx.user.profile.profileId)
                        ),
                    };
                }
                if (result.status === 'abandoned' || result.status === 'absent') {
                    return { status: 'not_found' as const, id: input.id };
                }

                return {
                    status: 'pending' as const,
                    id: input.id,
                    operationId: input.operationId,
                };
            }),

        getRecovery: profileRouteWithoutInputCapture
            .meta({
                openapi: openapi(
                    'GET',
                    '/share-links/{id}/recovery',
                    'Get owner-encrypted recovery (owner only)'
                ),
                requiredScope: AUTH_GRANT_SHARE_LINKS_READ_SCOPE,
            })
            .input(ShareLinkOperationKeyInputValidator.pick({ id: true }))
            .output(ShareLinkOwnerRecoveryOutputValidator)
            .query(async ({ ctx, input }) => {
                const dependencies = await resolve();
                const result = await runCoordinated(() =>
                    dependencies.coordinator.readOwnerRecovery(input.id, {
                        namespace: dependencies.namespace,
                        ownerProfileId: ctx.user.profile.profileId,
                    })
                );

                if (!result.ok) notFound();

                const parsed = ShareOwnerRecoveryValidator.safeParse(
                    result.value.ownerEncryptedRecovery
                );
                if (!parsed.success) notFound();

                return { recovery: parsed.data };
            }),
    });
};

export type ShareLinksRouter = ReturnType<typeof createShareLinksRouter>;

/** Per-hour owner write budget. Fails closed when the cache is unavailable. */
export const enforceOwnerShareWriteRateLimit = async (
    namespace: string,
    ownerProfileId: string
): Promise<void> => {
    await enforceRateLimits([
        {
            key: `share-link-owner-write:${namespace}:${ownerProfileId}`,
            limit: 60,
            windowSeconds: 60 * 60,
            description: 'owner share-link writes',
        },
    ]);
};

/**
 * Lazy production composition. Config is resolved before any signer/graph import;
 * a disabled or malformed configuration resolves to `null` and every procedure
 * answers NOT_FOUND without touching a signer or the graph.
 */
const initializeProductionDependencies =
    createRetryableLazyInitializer<ShareLinkRouterDependencies | null>(() =>
        buildProductionDependencies(
            resolveShareLinkOwnerApiConfig(process.env as Record<string, unknown>) as Extract<
                ShareLinkOwnerApiConfigResolution,
                { status: 'enabled' }
            >
        )
    );

const getProductionDependencies = async (): Promise<ShareLinkRouterDependencies | null> => {
    const config = resolveShareLinkOwnerApiConfig(process.env as Record<string, unknown>);

    if (config.status !== 'enabled') return null;

    return initializeProductionDependencies();
};

const buildProductionDependencies = async (
    config: Extract<ShareLinkOwnerApiConfigResolution, { status: 'enabled' }>
): Promise<ShareLinkRouterDependencies | null> => {
    const [
        { getServerDidWebDID },
        { createDidWebLearnCardTokenSigner },
        clientModule,
        runtimeModule,
        { ensureShareLinkConstraints },
        { createProductionShareLinkPolicySource },
        listRepository,
    ] = await Promise.all([
        import('@helpers/learnCard.helpers'),
        import('@helpers/share-content-client/adapters'),
        import('@helpers/share-content-client'),
        import('@helpers/share-link-coordinator/runtime'),
        import('../models/share-link-constraints'),
        import('@helpers/share-link-policy/production'),
        import('@accesslayer/share-link/list'),
    ]);

    const clientConfig = clientModule.resolveShareContentClientConfig({
        enabled: true,
        origin: config.origin,
        namespace: config.namespace,
        audience: config.audience,
        signerDid: getServerDidWebDID(),
        allowInsecureLoopback: config.allowInsecureLoopback,
        signer: createDidWebLearnCardTokenSigner(),
    });

    if (!clientConfig.enabled) return null;

    const client = clientModule.createShareContentClient(clientConfig);
    const policyResolver = createShareLinkPolicyResolver(createProductionShareLinkPolicySource());
    const coordinator = runtimeModule.createRuntimeShareLinkCoordinator({
        client,
        leaseOwner: 'brain-share-link-owner-api',
        policyResolver,
    });
    const recovery = runtimeModule.createRuntimeRecoveryRunnerDependencies({
        client,
        claimant: 'brain-share-link-owner-api',
        namespace: config.namespace,
    });

    await ensureShareLinkConstraints();

    return {
        namespace: config.namespace,
        coordinator,
        recovery,
        listShareLinks: listRepository.listShareLinks,
        enforceOwnerWriteRateLimit: ownerProfileId =>
            enforceOwnerShareWriteRateLimit(config.namespace, ownerProfileId),
        resolveViewCountingEligibility: async ownerProfileId =>
            (await policyResolver.resolve(ownerProfileId)).viewCountingEnabled,
    };
};

export const shareLinksRouter = createShareLinksRouter(getProductionDependencies);
