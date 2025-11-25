import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { SigningAuthorityAuthorizationValidator } from 'types/signing-authority';
import { createSigningAuthorityForDID } from '@accesslayer/signing-authority/create';
import { getSigningAuthorityById, getSigningAuthoritiesForDid, getSigningAuthorityForDid } from '@accesslayer/signing-authority/read';

import { t, didAndChallengeRoute } from '@routes';

import { MongoSigningAuthorityValidator } from '@models';
import { getSigningAuthorityWithEndpoint } from '@helpers/signingAuthority.helpers';

export const signingAuthorityRouter = t.router({
    createSigningAuthority: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/signing-authority/create',
                tags: ['Signing Authority'],
                summary: 'Create a Signing Authority',
                description:
                    "This route is used to create a new signing authority that can sign credentials on the current user's behalf",
            },
        })
        .input(z.object({ name: z.string() }))
        .output(MongoSigningAuthorityValidator.omit({ seed: true }))
        .mutation(async ({ input, ctx }) => {
            
            const { name } = input;

            if(await getSigningAuthorityForDid(ctx.user.did, name)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: `Signing Authority with name, ${name}, already exists for user.`,
                });
            }
            const createdId = await createSigningAuthorityForDID(ctx.user.did, name);
            if(!createdId) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Signing Authority could not be created for user.`,
                });
            }

            const signingAuthority = await getSigningAuthorityById(createdId);
            if(!signingAuthority) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Signing Authority could not be created for user.`,
                });
            }
            
            return getSigningAuthorityWithEndpoint(signingAuthority, ctx.domain);
        }),
    signingAuthorities: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/signing-authority/get',
                tags: ['Signing Authority'],
                summary: 'View signing authorities',
                description: "This route shows the current user's signing authorities",
            },
        })
        .input(z.void())
        .output(MongoSigningAuthorityValidator.omit({ seed: true }).array())
        .query(async ({ ctx }) => {
            const signingAuthorities = await getSigningAuthoritiesForDid(ctx.user.did);
            return signingAuthorities.map(sa => getSigningAuthorityWithEndpoint(sa, ctx.domain))
        }),
    authorizeSigningAuthority: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/signing-authority/authorize',
                tags: ['Signing Authority'],
                summary: 'Authorize a Signing Authority to take an action',
                description:
                    "This route is used to authorize a signing authority to sign specific credentials on the current user's behalf",
            },
        })
        .input(z.object({ name: z.string(), authorization: SigningAuthorityAuthorizationValidator }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            
            const { name } = input;

            const signingAuthority = await getSigningAuthorityForDid(ctx.user.did, name);
            if(!signingAuthority) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Signing Authority with name, ${name}, does not exist for user.`,
                });
            }

            // TODO: Add authorization logic.

            return true;
        }),
});
export type ProfilesRouter = typeof signingAuthorityRouter;