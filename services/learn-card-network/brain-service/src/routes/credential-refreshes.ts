import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    AllocateCredentialRefreshInputValidator,
    AllocateCredentialRefreshResultValidator,
    GetCredentialRefreshHistoryInputValidator,
    GetCredentialRefreshHistoryResultValidator,
    PublishCredentialRefreshInputValidator,
    PublishCredentialRefreshResultValidator,
    VCValidator,
} from '@learncard/types';
import type { PublishCredentialRefreshInput } from '@learncard/types';

import { t, profileRoute } from '@routes';
import { getProfileByDid, getProfileByProfileId } from '@accesslayer/profile/read';
import {
    getCredentialRefresh,
    getCredentialRefreshVersions,
} from '@accesslayer/credential-refresh';
import {
    allocateCredentialRefresh,
    publishCredentialRefresh,
    sendRefreshableCredential,
} from '@helpers/credential-refresh.helpers';
import { getDidWeb } from '@helpers/did.helpers';

export const credentialRefreshesRouter = t.router({
    allocateCredentialRefresh: profileRoute
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

    sendRefreshableCredential: profileRoute
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
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            return sendRefreshableCredential({
                issuerProfile: profile,
                refreshId: input.refreshId,
                credential: input.credential,
                boostUri: input.boostUri,
                domain: ctx.domain,
            });
        }),

    publishCredentialRefresh: profileRoute
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
            });
        }),

    getCredentialRefreshHistory: profileRoute
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
                })),
                hasMore,
                cursor,
            };
        }),
});

export type CredentialRefreshesRouter = typeof credentialRefreshesRouter;
