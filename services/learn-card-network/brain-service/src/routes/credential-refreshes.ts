import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    AllocateCredentialRefreshInputValidator,
    AllocateCredentialRefreshResultValidator,
    VCValidator,
} from '@learncard/types';

import { t, profileRoute } from '@routes';
import { getProfileByDid, getProfileByProfileId } from '@accesslayer/profile/read';
import {
    allocateCredentialRefresh,
    sendRefreshableCredential,
} from '@helpers/credential-refresh.helpers';

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
        .input(z.object({ refreshId: z.string().min(1), credential: VCValidator }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            return sendRefreshableCredential({
                issuerProfile: profile,
                refreshId: input.refreshId,
                credential: input.credential,
                domain: ctx.domain,
            });
        }),
});

export type CredentialRefreshesRouter = typeof credentialRefreshesRouter;
