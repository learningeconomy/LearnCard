import { randomBytes } from 'node:crypto';

import { TRPCError } from '@trpc/server';

import {
    AcknowledgeViewInputValidator,
    AcknowledgeViewOutputValidator,
    ResolveShareLinkInputValidator,
    SHARE_VIEW_RECEIPT_TTL_SECONDS,
    ShareEnvelopeValidator,
    ShareLinkPublicContentViewValidator,
    ShareLinkPublicStateValidator,
} from '@learncard/types';
import { LCNNotificationTypeEnumValidator } from '@learncard/types';

import { openRouteWithoutInputCapture, t } from '@routes';
import type { ShareLinkPolicyResolver } from '@helpers/share-link-policy/types';
import { createShareLinkPolicyResolver } from '@helpers/share-link-policy/resolver';
import type { ShareContentContentProjection } from '@helpers/share-content-client/types';
import { createRetryableLazyInitializer } from '@helpers/share-link-owner/lazy-initializer';
import {
    createBoundedShareLinkDiagnosticReporter,
    createShareLinkDependencyResolver,
    SHARE_LINK_COMPOSITION_DIAGNOSTIC,
} from '@helpers/share-link-owner/diagnostics';
import { resolveShareLinkPublicApiConfig } from '@helpers/share-link-public/config';
import type { ShareLinkPublicApiConfigResolution } from '@helpers/share-link-public/config';
import type {
    ConsumeShareViewReceiptInput,
    ConsumeShareViewReceiptOutcome,
    PersistShareViewReceiptInput,
    ShareViewEligibilitySource,
} from '@accesslayer/share-link';
import type { ShareLinkRecord } from '../models/ShareLink';

/**
 * LC-2187 public (anonymous) share-link API: resolve, guarded content and
 * privacy-uniform view acknowledgement.
 *
 * Disabled by default and fail-closed. There is no caller authority of any kind:
 * namespace comes only from trusted server configuration, the owner only from
 * the committed share, and there is never a caller-supplied object ref, URL,
 * key or policy field. Resolve returns metadata only; resolve/previews never
 * create a receipt or a count. The content route proxies the reviewed client
 * transport and only releases bytes from one committed tuple after a final
 * current-state recheck.
 */

export type PublicShareLinkSharer = { displayName: string; avatar?: string };

export type PublicShareLinkRouterDependencies = {
    readonly namespace: string;
    readonly repository: {
        getShareLink: (input: {
            shareId: string;
            namespace?: string;
        }) => Promise<ShareLinkRecord | null>;
        /**
         * Namespace/owner-scoped read of the reviewed committted content tuple.
         * Production delegates to `coordinator.fetchShareContent`, which applies
         * the final committed-tuple recheck after the awaited remote read.
         */
        fetchContent: (input: {
            shareId: string;
            namespace: string;
            ownerProfileId: string;
        }) => Promise<
            { ok: true; value: ShareContentContentProjection } | { ok: false; error: string }
        >;
    };
    readonly receipts: {
        persist: (input: PersistShareViewReceiptInput) => Promise<boolean>;
        /** Owner for a receipt that belongs to `namespace`; null otherwise. */
        lookupOwner: (receipt: string, namespace: string) => Promise<string | null>;
        lookupContext?: (
            receipt: string,
            namespace: string
        ) => Promise<{ ownerProfileId: string; shareId: string } | null>;
        consume: (input: ConsumeShareViewReceiptInput) => Promise<ConsumeShareViewReceiptOutcome>;
    };
    readonly policyResolver: ShareLinkPolicyResolver;
    /**
     * Optional transaction-compatible trusted eligibility source. Production
     * omits it (no authoritative age source), so no receipt is issued or
     * consumed. A caller that supplies one grants no authority beyond the
     * source's own under-lock checks.
     */
    readonly eligibilitySource?: ShareViewEligibilitySource;
    readonly getSharer: (ownerProfileId: string) => Promise<PublicShareLinkSharer | null>;
    readonly verifyPasscode?: (passcodeHash: string, passcode: string) => Promise<boolean>;
    readonly passcodeAttempts?: {
        canAttempt: (shareId: string, sourceIp?: string) => Promise<boolean>;
        recordFailure: (shareId: string, sourceIp?: string) => Promise<void>;
    };
    readonly notifyView?: (input: {
        shareId: string;
        ownerProfileId: string;
        title: string;
        selectedCount: number;
        viewCount: number;
        viewedAt: string;
    }) => Promise<void>;
    readonly enforceRateLimit: (window: {
        key: string;
        limit: number;
        windowSeconds: number;
        description: string;
    }) => Promise<void>;
    readonly contentUrlFor: (shareId: string) => string;
    readonly newReceipt: () => string;
    readonly now: () => Date;
    /** Aggregate-only dependency-failure telemetry; never includes input. */
    readonly reportFailure: (category: string) => void;
};

type PublicShareClassification =
    | { state: 'active'; record: ShareLinkRecord }
    | { state: 'expired'; expiresAt: string }
    | { state: 'stopped'; stoppedAt: string }
    | { state: 'not_found' };

/**
 * Strict public classification. Stopped wins over expired; `staging`,
 * `content_missing`, `pending` and any missing object binding fail closed to
 * `not_found` so a half-committed revision is never advertised.
 */
export const classifyPublicShare = (
    record: ShareLinkRecord | null,
    now: Date
): PublicShareClassification => {
    if (!record) return { state: 'not_found' };

    if (record.status === 'stopped') {
        return { state: 'stopped', stoppedAt: record.stoppedAt ?? record.updatedAt };
    }

    if (record.expiresAt && Date.parse(record.expiresAt) <= now.getTime()) {
        return { state: 'expired', expiresAt: record.expiresAt };
    }

    if (
        record.status !== 'active' ||
        record.contentState !== 'finalized' ||
        !record.activeObjectRef ||
        !record.activeObjectOperationId
    ) {
        return { state: 'not_found' };
    }

    return { state: 'active', record };
};

function notFound(): never {
    throw new TRPCError({ code: 'NOT_FOUND' });
}

const openapi = (method: 'GET' | 'POST', path: `/${string}`, summary: string) => ({
    protect: false as const,
    method,
    path,
    tags: ['ShareLinks'],
    summary,
});

const PUBLIC_RESOLVE_PATH = '/public/share-links/{id}' as const;
const PUBLIC_CONTENT_PATH = '/public/share-links/{id}/content' as const;
const PUBLIC_ACK_PATH = '/public/share-links/acknowledge-view' as const;

const passcodeAccepted = async (
    record: ShareLinkRecord,
    passcode: string | undefined,
    dependencies: PublicShareLinkRouterDependencies,
    sourceIp?: string
): Promise<boolean> => {
    if (record.passcodeHash == null) return true;
    if (!passcode || !dependencies.verifyPasscode || !dependencies.passcodeAttempts) return false;
    try {
        if (!(await dependencies.passcodeAttempts.canAttempt(record.id, sourceIp))) return false;
        const accepted = await dependencies.verifyPasscode(record.passcodeHash, passcode);
        if (!accepted) await dependencies.passcodeAttempts.recordFailure(record.id, sourceIp);
        return accepted;
    } catch {
        dependencies.reportFailure('passcode_guard');
        return false;
    }
};

/**
 * Trusted relative content route mounted under the OpenAPI adapter's `/api`
 * base path. Never a LearnCloud object URL or a Host; a returned URL can be
 * fetched directly from the supported local adapters.
 */
export const publicShareContentUrl = (shareId: string): string =>
    `/api/public/share-links/${encodeURIComponent(shareId)}/content`;

const rateLimitKey = (kind: string, namespace: string, sourceIp?: string): string =>
    `share-link-public-${kind}:${namespace}:${sourceIp ?? 'unknown'}`;

export const createPublicShareLinksRouter = (
    getDependencies: () => Promise<PublicShareLinkRouterDependencies | null>
) => {
    const resolve = async (): Promise<PublicShareLinkRouterDependencies> => {
        let dependencies: PublicShareLinkRouterDependencies | null;

        try {
            dependencies = await getDependencies();
        } catch {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'share-link service is unavailable',
            });
        }

        if (!dependencies) notFound();

        return dependencies;
    };

    return t.router({
        resolve: openRouteWithoutInputCapture
            .meta({
                openapi: openapi('POST', PUBLIC_RESOLVE_PATH, 'Resolve public share metadata'),
            })
            .input(ResolveShareLinkInputValidator)
            .output(ShareLinkPublicStateValidator)
            .mutation(async ({ ctx, input }) => {
                let dependencies: PublicShareLinkRouterDependencies | null;
                try {
                    dependencies = await getDependencies();
                } catch {
                    return { state: 'not_found' as const, id: input.id };
                }

                // Disabled/invalid config: no repository, signer or remote call.
                if (!dependencies) return { state: 'not_found' as const, id: input.id };

                try {
                    await dependencies.enforceRateLimit({
                        key: rateLimitKey('resolve', dependencies.namespace, ctx.sourceIp),
                        limit: 120,
                        windowSeconds: 60,
                        description: 'public share-link resolve',
                    });
                } catch {
                    dependencies.reportFailure('resolve_rate_limit');
                    throw new TRPCError({
                        code: 'TOO_MANY_REQUESTS',
                        message: 'rate limit exceeded',
                    });
                }

                let record: ShareLinkRecord | null;
                try {
                    record = await dependencies.repository.getShareLink({
                        shareId: input.id,
                        namespace: dependencies.namespace,
                    });
                } catch {
                    // Raw repository failures must not escape with a message.
                    dependencies.reportFailure('resolve_repository');
                    return { state: 'not_found' as const, id: input.id };
                }
                const classification = classifyPublicShare(record, dependencies.now());

                if (classification.state === 'not_found') {
                    return { state: 'not_found' as const, id: input.id };
                }
                // Even lifecycle timestamps are private until a protected link
                // has been unlocked. Missing records never enter Argon2.
                if (
                    record &&
                    !(await passcodeAccepted(record, input.passcode, dependencies, ctx.sourceIp))
                ) {
                    return { state: 'passcode_required' as const, id: input.id };
                }

                if (classification.state === 'expired') {
                    return {
                        state: 'expired' as const,
                        id: input.id,
                        expiresAt: classification.expiresAt,
                    };
                }
                if (classification.state === 'stopped') {
                    return {
                        state: 'stopped' as const,
                        id: input.id,
                        stoppedAt: classification.stoppedAt,
                    };
                }
                let sharer: PublicShareLinkSharer | null;
                try {
                    sharer = await dependencies.getSharer(classification.record.ownerProfileId);
                } catch {
                    dependencies.reportFailure('resolve_sharer');
                    return { state: 'not_found' as const, id: input.id };
                }
                if (!sharer) return { state: 'not_found' as const, id: input.id };

                // Final current-state guard AFTER the awaited sharer lookup: if the
                // metadata revision changed while the sharer was being read, the
                // projection is stale and must not be returned.
                let latest: ShareLinkRecord | null;
                try {
                    latest = await dependencies.repository.getShareLink({
                        shareId: input.id,
                        namespace: dependencies.namespace,
                    });
                } catch {
                    dependencies.reportFailure('resolve_repository');
                    return { state: 'not_found' as const, id: input.id };
                }
                const latestClassification = classifyPublicShare(latest, dependencies.now());
                if (
                    latestClassification.state !== 'active' ||
                    latestClassification.record.version !== classification.record.version
                ) {
                    return { state: 'not_found' as const, id: input.id };
                }

                return {
                    state: 'active' as const,
                    id: classification.record.id,
                    title: classification.record.title,
                    ...(classification.record.note === null
                        ? {}
                        : { note: classification.record.note }),
                    selectedCount: classification.record.selectedCount,
                    contentVersion: classification.record.contentVersion,
                    contentUrl: dependencies.contentUrlFor(classification.record.id),
                    sharer: {
                        displayName: sharer.displayName.slice(0, 120),
                        ...(sharer.avatar ? { avatar: sharer.avatar.slice(0, 2048) } : {}),
                    },
                    createdAt: classification.record.createdAt,
                    updatedAt: classification.record.updatedAt,
                    expiresAt: classification.record.expiresAt,
                };
            }),

        content: openRouteWithoutInputCapture
            .meta({
                openapi: openapi('POST', PUBLIC_CONTENT_PATH, 'Fetch guarded share content'),
            })
            .input(ResolveShareLinkInputValidator)
            .output(ShareLinkPublicContentViewValidator)
            .mutation(async ({ ctx, input }) => {
                const dependencies = await resolve();

                // The content response is large; a rate-limit/dependency failure
                // fails closed with a fixed safe error (no raw message escapes).
                try {
                    await dependencies.enforceRateLimit({
                        key: rateLimitKey('content', dependencies.namespace, ctx.sourceIp),
                        limit: 60,
                        windowSeconds: 60,
                        description: 'public share-link content',
                    });
                } catch {
                    dependencies.reportFailure('content_rate_limit');
                    throw new TRPCError({
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'share-link content is unavailable',
                    });
                }

                const readActiveShare = async (): Promise<ShareLinkRecord> => {
                    let candidate: ShareLinkRecord | null;
                    try {
                        candidate = await dependencies.repository.getShareLink({
                            shareId: input.id,
                            namespace: dependencies.namespace,
                        });
                    } catch {
                        dependencies.reportFailure('content_repository');
                        throw new TRPCError({
                            code: 'SERVICE_UNAVAILABLE',
                            message: 'share-link content is unavailable',
                        });
                    }

                    const classification = classifyPublicShare(candidate, dependencies.now());
                    if (classification.state !== 'active') notFound();

                    return classification.record;
                };

                const tupleMatches = (
                    projection: {
                        objectId: string;
                        operationId: string;
                        contentVersion: number;
                        payloadHash: string;
                    },
                    candidate: ShareLinkRecord
                ): boolean =>
                    projection.objectId === candidate.activeObjectRef &&
                    projection.operationId === candidate.activeObjectOperationId &&
                    projection.contentVersion === candidate.contentVersion &&
                    // Brain's committed `activeContentHash` is the payload hash
                    // (envelope + recovery, before IDs): exactly what the
                    // reviewed client verifies on stat. Never compare the
                    // tuple-inclusive LearnCloud `contentHash` here.
                    (candidate.activeContentHash === null ||
                        projection.payloadHash === candidate.activeContentHash);

                const first = await readActiveShare();

                if (!(await passcodeAccepted(first, input.passcode, dependencies, ctx.sourceIp))) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: 'share-link passcode required',
                    });
                }

                let fetched: Awaited<
                    ReturnType<PublicShareLinkRouterDependencies['repository']['fetchContent']>
                >;
                try {
                    fetched = await dependencies.repository.fetchContent({
                        shareId: input.id,
                        namespace: dependencies.namespace,
                        ownerProfileId: first.ownerProfileId,
                    });
                } catch {
                    dependencies.reportFailure('content_fetch');
                    throw new TRPCError({
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'share-link content is unavailable',
                    });
                }

                if (!fetched.ok) {
                    if (
                        fetched.error === 'UNAVAILABLE' ||
                        fetched.error === 'TIMEOUT' ||
                        fetched.error === 'NETWORK_ERROR' ||
                        fetched.error === 'MALFORMED_RESPONSE' ||
                        fetched.error === 'RESPONSE_TOO_LARGE' ||
                        fetched.error === 'UNEXPECTED_STATUS'
                    ) {
                        throw new TRPCError({
                            code: 'SERVICE_UNAVAILABLE',
                            message: 'share-link content is unavailable',
                        });
                    }
                    notFound();
                }

                // Fresh authoritative policy (never an earlier owner snapshot and
                // never a caller field). A policy resolver failure is a fixed safe
                // error, not a raw leak.
                let policy: Awaited<ReturnType<ShareLinkPolicyResolver['resolve']>>;
                try {
                    policy = await dependencies.policyResolver.resolve(first.ownerProfileId);
                } catch {
                    dependencies.reportFailure('content_policy');
                    throw new TRPCError({
                        code: 'SERVICE_UNAVAILABLE',
                        message: 'share-link content is unavailable',
                    });
                }

                // Re-read AFTER the awaited policy resolve: a revoke/replacement/
                // expiry during policy resolution must withhold the bytes.
                const persistRecord = await readActiveShare();
                if (
                    persistRecord.version !== first.version ||
                    !tupleMatches(fetched.value, persistRecord)
                ) {
                    notFound();
                }

                const committedEligible =
                    persistRecord.minorPolicyViewCountingEnabled === true &&
                    persistRecord.minorPolicyResolved === true &&
                    persistRecord.minorPolicyIsMinor === false;
                const eligible =
                    policy.viewCountingEnabled &&
                    policy.policyResolved &&
                    policy.isMinor === false &&
                    committedEligible;

                const receipt = dependencies.newReceipt();

                if (eligible) {
                    try {
                        await dependencies.receipts.persist({
                            receipt,
                            namespace: dependencies.namespace,
                            ownerProfileId: persistRecord.ownerProfileId,
                            shareId: persistRecord.id,
                            shareVersion: persistRecord.version,
                            contentVersion: persistRecord.contentVersion,
                            objectRef: fetched.value.objectId,
                            operationId: fetched.value.operationId,
                            ttlSeconds: SHARE_VIEW_RECEIPT_TTL_SECONDS,
                            eligibilitySource: dependencies.eligibilitySource,
                            now: dependencies.now,
                        });
                    } catch {
                        // Fail closed on counting; the response shape is unchanged.
                        dependencies.reportFailure('receipt_persist');
                    }
                }

                // FINAL current-state check after ALL awaited work (policy resolve,
                // receipt persistence). No bytes are released unless the complete
                // committed tuple/status/expiry/version is still current, so a
                // revoke, replacement or expiry during persistence cannot return
                // content authorized against an earlier state.
                const finalRecord = await readActiveShare();
                if (
                    finalRecord.version !== persistRecord.version ||
                    !tupleMatches(fetched.value, finalRecord)
                ) {
                    notFound();
                }

                const envelope = ShareEnvelopeValidator.safeParse(fetched.value.envelope);
                if (!envelope.success) notFound();

                return {
                    id: finalRecord.id,
                    contentVersion: finalRecord.contentVersion,
                    envelope: envelope.data,
                    contentUrl: dependencies.contentUrlFor(finalRecord.id),
                    receipt,
                };
            }),

        acknowledgeView: openRouteWithoutInputCapture
            .meta({
                openapi: openapi('POST', PUBLIC_ACK_PATH, 'Acknowledge a share view receipt'),
            })
            .input(AcknowledgeViewInputValidator)
            .output(AcknowledgeViewOutputValidator)
            .mutation(async ({ ctx, input }) => {
                let dependencies: PublicShareLinkRouterDependencies | null;
                try {
                    dependencies = await getDependencies();
                } catch {
                    return { ok: true as const };
                }

                if (!dependencies) return { ok: true as const };

                // Rate limiting and dependency failures must never change the
                // uniform acknowledgement shape. Fail closed on counting only.
                try {
                    await dependencies.enforceRateLimit({
                        key: rateLimitKey('ack', dependencies.namespace, ctx.sourceIp),
                        limit: 120,
                        windowSeconds: 60,
                        description: 'public share-link acknowledgement',
                    });
                } catch {
                    dependencies.reportFailure('ack_rate_limit');
                    return { ok: true as const };
                }

                try {
                    // Owner is discovered from persisted receipt state, never from
                    // the caller. Unknown/padding tokens and tokens minted in
                    // another namespace simply return early.
                    const context = dependencies.receipts.lookupContext
                        ? await dependencies.receipts.lookupContext(
                              input.receipt,
                              dependencies.namespace
                          )
                        : null;
                    const ownerProfileId =
                        context?.ownerProfileId ??
                        (await dependencies.receipts.lookupOwner(
                            input.receipt,
                            dependencies.namespace
                        ));
                    if (ownerProfileId === null) return { ok: true as const };

                    const policy = await dependencies.policyResolver.resolve(ownerProfileId);

                    // The pre-lock resolve is a cheap fail-closed short-circuit,
                    // never authority: consume re-checks the committed snapshot
                    // and the transaction-compatible source under both locks.
                    if (!policy.viewCountingEnabled) return { ok: true as const };

                    const outcome = await dependencies.receipts.consume({
                        receipt: input.receipt,
                        namespace: dependencies.namespace,
                        eligibilitySource: dependencies.eligibilitySource,
                    });

                    if (outcome === 'consumed' && context && dependencies.notifyView) {
                        const share = await dependencies.repository.getShareLink({
                            shareId: context.shareId,
                            namespace: dependencies.namespace,
                        });
                        if (
                            share &&
                            share.ownerProfileId === context.ownerProfileId &&
                            share.notifyOnView === true &&
                            share.minorPolicyResolved === true &&
                            share.minorPolicyIsMinor === false &&
                            share.minorPolicyViewCountingEnabled === true &&
                            share.lastViewedAt
                        ) {
                            await dependencies.notifyView({
                                shareId: share.id,
                                ownerProfileId: share.ownerProfileId,
                                title: share.title,
                                selectedCount: share.selectedCount,
                                viewCount: share.viewCount,
                                viewedAt: share.lastViewedAt,
                            });
                        }
                    }
                } catch {
                    dependencies.reportFailure('ack_consume');
                }

                return { ok: true as const };
            }),
    });
};

export type PublicShareLinksRouter = ReturnType<typeof createPublicShareLinksRouter>;

/**
 * Lazy production composition. Config is resolved before any signer/graph/remote
 * import; a disabled configuration is inert and silent, while malformed wiring
 * emits a single sanitized diagnostic and still fails closed. A failed build is
 * not cached, so a later request retries.
 */
const initializeProductionDependencies =
    createRetryableLazyInitializer<PublicShareLinkRouterDependencies>(() =>
        buildProductionDependencies(
            resolveShareLinkPublicApiConfig(process.env as Record<string, unknown>) as Extract<
                ShareLinkPublicApiConfigResolution,
                { status: 'enabled' }
            >
        )
    );

export const getProductionDependencies =
    createShareLinkDependencyResolver<PublicShareLinkRouterDependencies>({
        resolveConfig: () =>
            resolveShareLinkPublicApiConfig(process.env as Record<string, unknown>),
        initializeDependencies: initializeProductionDependencies,
        reportDiagnostic: createBoundedShareLinkDiagnosticReporter(),
        configurationInvalidCategory:
            SHARE_LINK_COMPOSITION_DIAGNOSTIC.PUBLIC_CONFIGURATION_INVALID,
        initializationFailedCategory:
            SHARE_LINK_COMPOSITION_DIAGNOSTIC.PUBLIC_INITIALIZATION_FAILED,
    });

const buildProductionDependencies = async (
    config: Extract<ShareLinkPublicApiConfigResolution, { status: 'enabled' }>
): Promise<PublicShareLinkRouterDependencies> => {
    const [
        { getServerDidWebDID },
        { createDidWebLearnCardTokenSigner },
        clientModule,
        runtimeModule,
        { ensureShareLinkConstraints },
        { createProductionShareLinkPolicySource },
        { getProfileByProfileId },
        { verifySharePasscode },
        passcodeAbuse,
        { addNotificationToQueue },
        receiptModule,
        { getShareLink },
        { claimShareViewNotification },
        { getNotificationMessage },
        { resolveRecipientLocale },
    ] = await Promise.all([
        import('@helpers/learnCard.helpers'),
        import('@helpers/share-content-client/adapters'),
        import('@helpers/share-content-client'),
        import('@helpers/share-link-coordinator/runtime'),
        import('../models/share-link-constraints'),
        import('@helpers/share-link-policy/production'),
        import('@accesslayer/profile/read'),
        import('@helpers/share-link-passcode'),
        import('@helpers/share-link-passcode-abuse'),
        import('@helpers/notifications.helpers'),
        import('@accesslayer/share-link/receipt'),
        import('@accesslayer/share-link/read'),
        import('@helpers/share-link-view-notification'),
        import('@helpers/notificationMessages'),
        import('@helpers/getRecipientLocale.helpers'),
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

    if (!clientConfig.enabled) {
        // Fail the build so the retryable lazy initializer does not cache it.
        throw new Error('share-content client configuration is invalid');
    }

    const client = clientModule.createShareContentClient(clientConfig);
    const policyResolver = createShareLinkPolicyResolver(createProductionShareLinkPolicySource());
    const coordinator = runtimeModule.createRuntimeShareLinkCoordinator({
        client,
        leaseOwner: 'brain-share-link-public-api',
        policyResolver,
    });

    await ensureShareLinkConstraints();

    return {
        namespace: config.namespace,
        repository: {
            getShareLink: input => getShareLink(input),
            fetchContent: async input => {
                const result = await coordinator.fetchShareContent(input.shareId, {
                    namespace: input.namespace,
                    ownerProfileId: input.ownerProfileId,
                });

                return result.ok ? { ok: true, value: result.value } : result;
            },
        },
        receipts: {
            persist: receiptModule.persistShareViewReceipt,
            lookupOwner: async (receipt, namespace) => {
                const owner = await receiptModule.readShareViewReceiptOwner(receipt, namespace);
                return owner;
            },
            lookupContext: receiptModule.readShareViewReceiptContext,
            consume: receiptModule.consumeShareViewReceipt,
        },
        policyResolver,
        verifyPasscode: verifySharePasscode,
        passcodeAttempts: {
            canAttempt: (shareId, sourceIp) =>
                passcodeAbuse.canAttemptSharePasscode(config.namespace, shareId, sourceIp),
            recordFailure: (shareId, sourceIp) =>
                passcodeAbuse.recordFailedSharePasscode(config.namespace, shareId, sourceIp),
        },
        notifyView: async notification => {
            if (!(await claimShareViewNotification(config.namespace, notification.shareId))) return;
            const profile = await getProfileByProfileId(notification.ownerProfileId);
            if (!profile) return;
            await addNotificationToQueue({
                type: LCNNotificationTypeEnumValidator.enum.APP_NOTIFICATION,
                to: profile,
                from: {
                    did: getServerDidWebDID(),
                    displayName: 'LearnCard',
                },
                message: getNotificationMessage('shareViewed', resolveRecipientLocale(profile), {
                    title: notification.title,
                    count: String(notification.selectedCount),
                }),
                data: {
                    metadata: {
                        shareView: {
                            count: notification.viewCount,
                            viewedAt: notification.viewedAt,
                        },
                    },
                },
            });
        },
        getSharer: async ownerProfileId => {
            const profile = await getProfileByProfileId(ownerProfileId);
            if (!profile) return null;

            return {
                displayName: profile.displayName,
                ...(profile.image ? { avatar: profile.image } : {}),
            };
        },
        enforceRateLimit: async window => {
            const { enforceRateLimits } = await import('@helpers/rateLimit.helpers');
            await enforceRateLimits([window]);
        },
        contentUrlFor: publicShareContentUrl,
        newReceipt: () => randomBytes(32).toString('base64url'),
        now: () => new Date(),
        reportFailure: category => {
            // Aggregate-only: a fixed category string, no receipt/share/user data.
            console.warn('share_link_public_dependency_failure', { category });
        },
    };
};

export const publicShareLinksRouter = createPublicShareLinksRouter(getProductionDependencies);
