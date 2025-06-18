import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';
import { createAuthGrant } from '@accesslayer/auth-grant/create';
import {
    getAuthGrantById,
    getAuthGrantsForProfile,
    isAuthGrantAssociatedWithProfile,
} from '@accesslayer/auth-grant/read';
import {
    AuthGrantQueryValidator,
    AuthGrantValidator,
    AuthGrantStatusValidator,
    AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX,
} from '@learncard/types';
import { updateAuthGrant } from '@accesslayer/auth-grant/update';
import { deleteAuthGrant } from '@accesslayer/auth-grant/delete';
import { associateAuthGrantWithProfile } from '@accesslayer/auth-grant/relationships/create';
import { v4 as uuid } from 'uuid';
import { AUTH_GRANT_READ_ONLY_SCOPE } from 'src/constants/auth-grant';

export const authGrantsRouter = t.router({
    addAuthGrant: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/auth-grant/create',
                tags: ['Auth Grants'],
                summary: 'Add AuthGrant to your profile',
                description: 'Add AuthGrant to your profile',
            },
            requiredScope: 'authGrants:write',
        })
        .input(
            AuthGrantValidator.partial().omit({
                id: true,
                status: true,
                createdAt: true,
                challenge: true,
            })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            try {
                const authGrant = await createAuthGrant({
                    scope: AUTH_GRANT_READ_ONLY_SCOPE,
                    ...input,
                    status: AuthGrantStatusValidator.Values.active,
                    createdAt: new Date().toISOString(),
                    challenge: `${AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX}${uuid()}`,
                });

                await associateAuthGrantWithProfile(authGrant.id, ctx.user.profile.profileId);

                return authGrant.id;
            } catch {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to add AuthGrant',
                });
            }
        }),

    getAuthGrant: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/auth-grant/{id}',
                tags: ['Auth Grants'],
                summary: 'Get AuthGrant',
                description: 'Get AuthGrant',
            },
            requiredScope: 'authGrants:read',
        })
        .input(z.object({ id: z.string() }))
        .output(AuthGrantValidator.partial().optional())
        .query(async ({ input, ctx }) => {
            if (!(await isAuthGrantAssociatedWithProfile(input.id, ctx.user.profile.profileId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This AuthGrant is not associated with you!',
                });
            }

            const authGrant = await getAuthGrantById(input.id);

            if (!authGrant) return undefined;

            const { id: _id, ...doc } = authGrant;

            return doc;
        }),

    getAuthGrants: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/auth-grants',
                tags: ['Auth Grants'],
                summary: 'Get My AuthGrants',
                description: 'Get My AuthGrants',
            },
            requiredScope: 'authGrants:read',
        })
        .input(
            z
                .object({
                    limit: z.number().optional(),
                    cursor: z.string().optional(),
                    query: AuthGrantQueryValidator.optional(),
                })
                .optional()
        )
        .output(AuthGrantValidator.array())
        .query(async ({ ctx, input }) => {
            return getAuthGrantsForProfile(ctx.user.profile, {
                limit: input?.limit || 100,
                cursor: input?.cursor,
                query: input?.query || {},
            });
        }),

    updateAuthGrant: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/auth-grant/update/{id}',
                tags: ['Auth Grants'],
                summary: 'Update AuthGrant',
                description: 'Update AuthGrant',
            },
            requiredScope: 'authGrants:write',
        })
        .input(
            z.object({
                id: z.string(),
                updates: AuthGrantValidator.partial().omit({
                    id: true,
                    scope: true,
                    status: true,
                    createdAt: true,
                    expiresAt: true,
                    challenge: true,
                }),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            if (!(await isAuthGrantAssociatedWithProfile(input.id, ctx.user.profile.profileId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This AuthGrant is not associated with you!',
                });
            }

            // Extra check to reject sensitive, invalid updates
            const invalidUpdates = ['id', 'scope', 'status', 'createdAt', 'expiresAt', 'challenge'];
            if (invalidUpdates.some(key => input.updates.hasOwnProperty(key))) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message:
                        'Cannot update id, scope, status, createdAt, expiresAt, or challenge of an AuthGrant',
                });
            }

            const authGrant = await getAuthGrantById(input.id);

            if (!authGrant) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'AuthGrant not found',
                });
            }

            return updateAuthGrant(authGrant, input.updates);
        }),
    revokeAuthGrant: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/auth-grant/{id}/revoke',
                tags: ['Auth Grants'],
                summary: 'Revoke AuthGrant',
                description: 'Revoke AuthGrant',
            },
            requiredScope: 'authGrants:write',
        })
        .input(z.object({ id: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            if (!(await isAuthGrantAssociatedWithProfile(input.id, ctx.user.profile.profileId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This AuthGrant is not associated with you!',
                });
            }

            const authGrant = await getAuthGrantById(input.id);

            if (!authGrant) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'AuthGrant not found',
                });
            }

            await updateAuthGrant(authGrant, { status: AuthGrantStatusValidator.Values.revoked });

            return true;
        }),
    deleteAuthGrant: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/auth-grant/{id}',
                tags: ['Auth Grants'],
                summary: 'Delete AuthGrant',
                description: 'Delete AuthGrant',
            },
            requiredScope: 'authGrants:delete',
        })
        .input(z.object({ id: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            if (!(await isAuthGrantAssociatedWithProfile(input.id, ctx.user.profile.profileId))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This AuthGrant is not associated with you!',
                });
            }

            const authGrant = await getAuthGrantById(input.id);

            if (!authGrant) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'AuthGrant not found',
                });
            }

            if (authGrant.status !== AuthGrantStatusValidator.Values.revoked) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message:
                        'This AuthGrant is not revoked. You can only delete revoked AuthGrants.',
                });
            }

            await deleteAuthGrant(input.id);

            return true;
        }),
});
export type AuthGrantsRouter = typeof authGrantsRouter;
