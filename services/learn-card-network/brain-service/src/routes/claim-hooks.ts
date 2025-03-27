import { z } from 'zod';

import {
    ClaimHookQueryValidator,
    ClaimHookValidator,
    PaginatedClaimHooksValidator,
    PaginationOptionsValidator,
} from '@learncard/types';

import { t, profileRoute } from '@routes';

import { TRPCError } from '@trpc/server';
import { getBoostByUri } from '@accesslayer/boost/read';
import { getBoostPermissions, isProfileBoostAdmin } from '@accesslayer/boost/relationships/read';
import { createClaimHook } from '@accesslayer/claim-hook/create';
import {
    addClaimHookForBoost,
    addClaimHookTarget,
    addRoleToGrantForClaimHook,
} from '@accesslayer/claim-hook/relationships/create';
import { createRole } from '@accesslayer/role/create';
import { getClaimHookById, getClaimHooksForBoost } from '@accesslayer/claim-hook/read';
import { deleteClaimHook } from '@accesslayer/claim-hook/delete';
import { getClaimBoostForClaimHook } from '@accesslayer/claim-hook/relationships/read';

export const claimHooksRouter = t.router({
    createClaimHook: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/claim-hook/create',
                tags: ['Claim Hooks'],
                summary: 'Creates a claim hook',
                description:
                    'This route creates a claim hook. Claim hooks are an atomic action that will be performed when a boost is claimed',
            },
        })
        .input(z.object({ hook: ClaimHookValidator }))
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const { hook } = input;

            if (hook.type === 'GRANT_PERMISSIONS') {
                const {
                    data: { claimUri, targetUri, permissions: claimPermissions },
                    type,
                } = hook;
                const claimBoost = await getBoostByUri(claimUri);
                const targetBoost = await getBoostByUri(targetUri);

                if (!claimBoost) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Could not find claim boost',
                    });
                }

                if (!targetBoost) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Could not find target boost',
                    });
                }

                if (!(await isProfileBoostAdmin(profile, claimBoost))) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: 'Profile does not have admin rights over claim boost',
                    });
                }

                const permissions = await getBoostPermissions(targetBoost, profile);

                if (!permissions.canManagePermissions) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: 'Profile does not have permission to create this Claim Hook',
                    });
                }

                for (let permission in claimPermissions) {
                    if (
                        permission !== 'role' &&
                        !permissions[permission as keyof typeof permissions]
                    ) {
                        throw new TRPCError({
                            code: 'UNAUTHORIZED',
                            message: `Profile does not have permission to create a GRANT_PERMISSIONS Claim Hook with permission ${permission}`,
                        });
                    }
                }

                const claimHook = await createClaimHook({ type });

                await Promise.all([
                    createRole(claimPermissions).then(role =>
                        addRoleToGrantForClaimHook(claimHook, role)
                    ),
                    addClaimHookForBoost(claimBoost, claimHook),
                    addClaimHookTarget(targetBoost, claimHook),
                ]);

                return claimHook.id;
            }

            if (hook.type === 'ADD_ADMIN') {
                const {
                    data: { claimUri, targetUri },
                    type,
                } = hook;
                const claimBoost = await getBoostByUri(claimUri);
                const targetBoost = await getBoostByUri(targetUri);

                if (!claimBoost) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Could not find claim boost',
                    });
                }

                if (!targetBoost) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Could not find target boost',
                    });
                }

                if (!(await isProfileBoostAdmin(profile, claimBoost))) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: 'Profile does not have admin rights over claim boost',
                    });
                }

                if (!(await isProfileBoostAdmin(profile, targetBoost))) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: 'Profile does not have permission to create this Claim Hook',
                    });
                }

                const claimHook = await createClaimHook({ type });

                await Promise.all([
                    addClaimHookForBoost(claimBoost, claimHook),
                    addClaimHookTarget(targetBoost, claimHook),
                ]);

                return claimHook.id;
            }

            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Unknown Claim Hook Type: ${(hook as any).type}`,
            });
        }),

    getClaimHooksForBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/claim-hook/get',
                tags: ['Claim Hooks'],
                summary: 'Gets Claim Hooks',
                description: 'This route gets claim hooks attached to a given boost',
            },
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                query: ClaimHookQueryValidator.optional(),
                uri: z.string(),
            })
        )
        .output(PaginatedClaimHooksValidator)
        .query(async ({ ctx, input }) => {
            const { limit, cursor, query, uri } = input;
            const { domain } = ctx;

            const boost = await getBoostByUri(uri);

            if (!boost) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find boost',
                });
            }

            const records = await getClaimHooksForBoost(boost, {
                limit: limit + 1,
                cursor,
                query,
                domain,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.updatedAt;

            return {
                hasMore,
                records: records.slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    deleteClaimHook: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/claim-hook/update',
                tags: ['Claim Hooks'],
                summary: 'Delete a Claim Hook',
                description: 'This route deletes a claim hook',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const { id } = input;

            const claimHook = await getClaimHookById(id);

            if (!claimHook) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find Claim Hook' });
            }

            const claimBoost = await getClaimBoostForClaimHook(claimHook);

            if (!claimBoost) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find Claim Boost for Claim Hook for permissions check...',
                });
            }

            if (!(await isProfileBoostAdmin(profile, claimBoost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have admin rights over claim boost',
                });
            }

            await deleteClaimHook(claimHook);

            return true;
        }),
});
export type ClaimHooksRouter = typeof claimHooksRouter;
