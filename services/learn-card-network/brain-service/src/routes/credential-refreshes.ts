import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    AllocateCredentialRefreshInputValidator,
    AttachCredentialRefreshStatusEntriesInputValidator,
    AllocateCredentialRefreshResultValidator,
    EncryptionRecipientsResultValidator,
    GetCredentialRefreshHistoryInputValidator,
    GetCredentialRefreshHistoryResultValidator,
    GetEncryptionRecipientsInputValidator,
    PublishCredentialRefreshInputValidator,
    PublishCredentialRefreshResultValidator,
    PublishHolderEncryptedRefreshInputValidator,
    SendHolderEncryptedRefreshableInputValidator,
    VCValidator,
    GetCredentialRefreshReceiptInputValidator,
    CredentialRefreshReceiptValidator,
} from '@learncard/types';
import type { PublishCredentialRefreshInput } from '@learncard/types';

import { t, credentialProfileRoute } from '@routes';
import { getCredentialRefreshRuntimeEnvironment } from '@environment';
import { getProfileByDid, getProfileByProfileId } from '@accesslayer/profile/read';
import {
    getCredentialRefresh,
    getCredentialRefreshVersions,
    getCredentialRefreshReceiptBinding,
} from '@accesslayer/credential-refresh';
import {
    allocateCredentialRefresh,
    getCurrentEncryptionRecipients,
    publishCredentialRefresh,
    publishHolderEncryptedRefreshableCredential,
    sendHolderEncryptedRefreshableCredential,
    sendRefreshableCredential,
} from '@helpers/credential-refresh.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { isRelationshipBlocked } from '@helpers/connection.helpers';
import { ensureCredentialRefreshConstraints } from '../models/credential-refresh-constraints';
import { getBitstringStatusListEntries } from '@learncard/helpers';
import { neogma } from '@instance';
import { matchesCredentialStatusDigest } from '@helpers/credential-refresh-materiality.helpers';
import { bindRefreshStatusEntries } from '@helpers/managed-status.helpers';
import { constructUri, getUriParts } from '@helpers/uri.helpers';
import { getCredentialRefreshServiceUrl } from '@helpers/credential-refresh.helpers';

const credentialRefreshRoute = credentialProfileRoute.use(async ({ ctx, next }) => {
    if (!getCredentialRefreshRuntimeEnvironment().CREDENTIAL_REFRESH_ENABLED) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Credential refresh is not available',
        });
    }

    await ensureCredentialRefreshConstraints();

    return next({ ctx });
});

export const credentialRefreshesRouter = t.router({
    getReceipt: credentialRefreshRoute
        .meta({ requiredScope: 'credentials:read' })
        .input(GetCredentialRefreshReceiptInputValidator)
        .output(CredentialRefreshReceiptValidator.nullable())
        .query(async ({ ctx, input }) => {
            const { id, type } = getUriParts(input.uri);
            if (type !== 'credential' || input.uri !== constructUri('credential', id, ctx.domain)) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid delivery URI' });
            }
            const refresh = await getCredentialRefreshReceiptBinding(
                id,
                ctx.user.profile.profileId
            );
            if (refresh === null) return null;
            if (
                !refresh ||
                !refresh.holderDid ||
                refresh.holderProfileId !== ctx.user.profile.profileId ||
                !['awaiting_claim', 'active'].includes(refresh.state)
            ) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Delivery not found' });
            }
            // Coordinates alone cannot reconstruct the exact signed descriptor of legacy sends.
            const binding = refresh.credentialStatusBinding ?? refresh.inboxCredentialStatus;
            if (binding === undefined) {
                throw new TRPCError({
                    code: 'PRECONDITION_FAILED',
                    message: 'Delivery binding unavailable',
                });
            }
            const status: unknown = JSON.parse(binding);
            return CredentialRefreshReceiptValidator.parse({
                refreshId: refresh.refreshId,
                credentialId: refresh.credentialId,
                issuerDid: refresh.issuerDid,
                holderDid: refresh.holderDid,
                refreshService: {
                    id: getCredentialRefreshServiceUrl(refresh.refreshId, ctx.domain),
                    type: 'LearnCardCredentialRefresh2026',
                    authorization: { type: 'LearnCardDIDAuth' },
                },
                ...(status === null ? {} : { credentialStatus: status }),
                encryptionMode: refresh.encryptionMode ?? 'network',
            });
        }),

    attachStatusEntries: credentialRefreshRoute
        .meta({ requiredScope: 'credentials:write' })
        .input(AttachCredentialRefreshStatusEntriesInputValidator)
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const refresh = await getCredentialRefresh(input.refreshId);
            if (!refresh || refresh.issuerProfileId !== ctx.user.profile.profileId) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential refresh not found' });
            }
            if (
                !matchesCredentialStatusDigest(
                    input.credentialStatus,
                    refresh.credentialStatusDigest
                )
            ) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Credential status does not match the original credential',
                });
            }
            const entries = getBitstringStatusListEntries({
                credentialStatus: input.credentialStatus,
            });
            if (entries.length === 0) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Credential has no supported public status entries',
                });
            }
            await neogma.getTransaction(null, async tx => {
                const result = await tx.run(
                    `MATCH (refresh:CredentialRefresh {refreshId: $refreshId})-[:ROOT]->(root:Credential)
                 SET root._statusMutationLock = true REMOVE root._statusMutationLock
                 RETURN root.id AS id`,
                    { refreshId: input.refreshId }
                );
                const root = result.records[0];
                if (!root)
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Credential has no original delivery',
                    });
                await bindRefreshStatusEntries(
                    input.refreshId,
                    entries,
                    refresh.issuerProfileId,
                    ctx.domain,
                    tx
                );
            });
            return true;
        }),

    allocateCredentialRefresh: credentialRefreshRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential-refresh/allocate',
                tags: ['Credential Refresh'],
                summary: 'Allocate a managed credential refresh service',
                description:
                    'Allocates an unguessable managed refresh service for a credential before it is signed.',
            },
            requiredScope: 'credentials:write',
        })
        .input(AllocateCredentialRefreshInputValidator)
        .output(AllocateCredentialRefreshResultValidator)
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { holder, credentialId } = input;

            const holderProfile = holder.profileId
                ? await getProfileByProfileId(holder.profileId)
                : await getProfileByDid(holder.did);

            if (!holderProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            if (await isRelationshipBlocked(profile, holderProfile)) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            const holderDids = new Set([
                holderProfile.did,
                getDidWeb(ctx.domain, holderProfile.profileId),
            ]);

            if (!holderDids.has(holder.did)) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Holder DID does not belong to the supplied profile',
                });
            }

            return allocateCredentialRefresh({
                issuerProfile: profile,
                holderProfile,
                holderDid: holder.did,
                credentialId,
                domain: ctx.domain,
            });
        }),

    sendRefreshableCredential: credentialRefreshRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential-refresh/send',
                tags: ['Credential Refresh'],
                summary: 'Send a refreshable credential',
                description:
                    'Binds a signed credential to its allocated refresh aggregate. The credential is stored holder-encrypted only.',
            },
            requiredScope: 'credentials:write',
        })
        .input(
            z.object({
                refreshId: z.string().min(1),
                credential: VCValidator,
                boostUri: z.string().optional(),
                skipNotification: z.boolean().optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = await sendRefreshableCredential({
                issuerProfile: profile,
                refreshId: input.refreshId,
                credential: input.credential,
                boostUri: input.boostUri,
                skipNotification: input.skipNotification,
                domain: ctx.domain,
            });

            return uri;
        }),

    /**
     * Holder-mode counterpart of `sendRefreshableCredential` (LC-2345): a separate
     * route rather than a branch of `send`/`sendRefreshableCredential`, so the
     * ciphertext-only input shape (`HolderEncryptedHandoffValidator`) never has to
     * share a validator with the plaintext `credential`/`signedCredential` paths.
     */
    sendHolderEncryptedRefreshable: credentialRefreshRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential-refresh/send-holder-encrypted',
                tags: ['Credential Refresh'],
                summary: 'Send a holder-mode (student-only encrypted) refreshable credential',
                description:
                    'Binds an already-encrypted handoff to its allocated refresh aggregate. The server never decrypts or processes the credential.',
            },
            requiredScope: 'credentials:write',
        })
        .input(SendHolderEncryptedRefreshableInputValidator)
        .output(z.object({ uri: z.string(), activityId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri, activityId } = await sendHolderEncryptedRefreshableCredential({
                issuerProfile: profile,
                handoff: input.handoff,
                boostUri: input.boostUri,
                skipNotification: input.skipNotification,
                domain: ctx.domain,
                onBehalfOf: ctx.user.onBehalfOf,
            });

            return { uri, activityId };
        }),

    /** Issuer-only: the current recipient set a holder-mode handoff must encrypt to. */
    getEncryptionRecipients: credentialRefreshRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/credential-refresh/encryption-recipients',
                tags: ['Credential Refresh'],
                summary: 'Get the current holder-mode encryption recipients',
                description:
                    'Returns the current key-agreement verification-method ids (holder + managers) a holder-mode handoff must encrypt to. Used after a RECIPIENTS_CHANGED conflict.',
            },
            requiredScope: 'credentials:read',
        })
        .input(GetEncryptionRecipientsInputValidator)
        .output(EncryptionRecipientsResultValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const recipientKeyIds = await getCurrentEncryptionRecipients({
                issuerProfile: profile,
                refreshId: input.refreshId,
            });

            return { recipientKeyIds };
        }),

    publishCredentialRefresh: credentialRefreshRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential-refresh/publish',
                tags: ['Credential Refresh'],
                summary: 'Publish a managed credential refresh version',
                description:
                    'Publishes a new immutable version of a refreshable credential (issuer-signed or via a signing authority) and atomically advances the refresh head. The version is stored holder-encrypted only.',
            },
            requiredScope: 'credentials:write',
        })
        .input(PublishCredentialRefreshInputValidator)
        .output(PublishCredentialRefreshResultValidator)
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            return publishCredentialRefresh({
                issuerProfile: profile,
                input: input as PublishCredentialRefreshInput,
                domain: ctx.domain,
                branding: ctx.tenant?.emailBranding,
            });
        }),

    /**
     * Holder-mode counterpart of `publishCredentialRefresh`: a separate route, for the
     * same reason as `sendHolderEncryptedRefreshable`. `PublishCredentialRefreshInputValidator`
     * has no signing-authority equivalent for a handoff — a holder aggregate rejects
     * signing-authority publication outright (`publishCredentialRefresh` enforces this).
     */
    publishHolderEncryptedRefreshable: credentialRefreshRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential-refresh/publish-holder-encrypted',
                tags: ['Credential Refresh'],
                summary: 'Publish a holder-mode (student-only encrypted) refresh version',
                description:
                    'Publishes a new immutable version from an already-encrypted handoff and atomically advances the refresh head. `notify` replaces server-inferred materiality.',
            },
            requiredScope: 'credentials:write',
        })
        .input(PublishHolderEncryptedRefreshInputValidator)
        .output(PublishCredentialRefreshResultValidator)
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            return publishHolderEncryptedRefreshableCredential({
                issuerProfile: profile,
                input,
                domain: ctx.domain,
                branding: ctx.tenant?.emailBranding,
            });
        }),

    getCredentialRefreshHistory: credentialRefreshRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/credential-refresh/history',
                tags: ['Credential Refresh'],
                summary: 'Get managed credential refresh history',
                description:
                    'Returns cursor-paginated, metadata-only issuer audit history for a managed credential refresh. Never includes credential bodies or encrypted payloads.',
            },
            requiredScope: 'credentials:read',
        })
        .input(GetCredentialRefreshHistoryInputValidator)
        .output(GetCredentialRefreshHistoryResultValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const aggregate = await getCredentialRefresh(input.refreshId);

            if (!aggregate) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Credential refresh not found',
                });
            }

            if (aggregate.issuerProfileId !== profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile did not allocate this credential refresh',
                });
            }

            const { records, hasMore, cursor } = await getCredentialRefreshVersions(
                input.refreshId,
                { cursor: input.cursor, limit: input.limit }
            );

            // Metadata-only projection: version, dates, ETag, signing mode, and the
            // safe issuer-authored summary. The output validator additionally strips
            // anything outside the shared contract.
            return {
                records: records.map(record => ({
                    version: record.version,
                    publishedAt: record.publishedAt,
                    effectiveAt: record.effectiveAt,
                    etag: record.etag,
                    signingMode: record.signingMode,
                    updateSummary: record.updateSummary,
                    updateReason: record.updateReason,
                })),
                hasMore,
                cursor,
            };
        }),
});

export type CredentialRefreshesRouter = typeof credentialRefreshesRouter;
