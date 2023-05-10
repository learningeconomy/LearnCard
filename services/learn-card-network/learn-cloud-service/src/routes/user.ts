import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import jwtDecode from 'jwt-decode';

import { t, didAndChallengeRoute } from '@routes';
import { getUserForDid } from '@accesslayer/user/read';
import { VPValidator } from '@learncard/types';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { DidAuthVP } from 'types/vp';
import { addDidToUser, removeDidFromUser, setDidAsPrimary } from '@accesslayer/user/update';
import { ensureUserForDid } from '@accesslayer/user/create';

export const userRouter = t.router({
    getDids: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/user/dids',
                tags: ['User'],
                summary: 'Get dids associated with this user',
                description: 'Gets all dids that have been associated with the user for this did',
            },
        })
        .input(z.void())
        .output(z.string().array())
        .query(async ({ ctx }) => {
            const user = await ensureUserForDid(ctx.user.did);

            return [user.did, ...user.associatedDids];
        }),

    addDid: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/user/dids/add',
                tags: ['User'],
                summary: 'Associate a did with this user',
                description: 'Associates a did with the user for this did',
            },
        })
        .input(z.object({ presentation: VPValidator.or(z.string()) }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { presentation } = input;

            const learnCard = await getEmptyLearnCard();

            const result = await learnCard.invoke.verifyPresentation(
                presentation,
                typeof presentation === 'string' ? { proofFormat: 'jwt' } : {}
            );

            if (
                result.warnings.length === 0 &&
                result.errors.length === 0 &&
                (result.checks.includes('JWS') || result.checks.includes('proof'))
            ) {
                const did =
                    typeof presentation === 'string'
                        ? jwtDecode<DidAuthVP>(presentation).vp.holder
                        : presentation.holder!;

                const existing = await getUserForDid(did);

                if (existing) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Did is already associated with a user',
                    });
                }

                await ensureUserForDid(ctx.user.did);

                return addDidToUser(ctx.user.did, did);
            }

            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid DID-Auth VP',
            });
        }),

    removeDid: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/user/dids/remove',
                tags: ['User'],
                summary: 'Disassociate a did with this user',
                description: 'Disassociates a did with the user for this did',
            },
        })
        .input(z.object({ presentation: VPValidator.or(z.string()) }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { presentation } = input;

            const learnCard = await getEmptyLearnCard();

            const result = await learnCard.invoke.verifyPresentation(
                presentation,
                typeof presentation === 'string' ? { proofFormat: 'jwt' } : {}
            );

            if (
                result.warnings.length === 0 &&
                result.errors.length === 0 &&
                (result.checks.includes('JWS') || result.checks.includes('proof'))
            ) {
                const did =
                    typeof presentation === 'string'
                        ? jwtDecode<DidAuthVP>(presentation).vp.holder
                        : presentation.holder!;

                const existing = await getUserForDid(did);

                if (!existing) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Did is not associated with any user',
                    });
                }

                const user = await ensureUserForDid(ctx.user.did);

                if (!user.associatedDids.includes(did)) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: 'Did is not associated with this user',
                    });
                }

                return removeDidFromUser(ctx.user.did, did);
            }

            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid DID-Auth VP',
            });
        }),

    setPrimaryDid: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/user/dids/setPrimary',
                tags: ['User'],
                summary: 'Sets the primary did for a user',
                description: 'Sets the primary did for the user with this did',
            },
        })
        .input(z.object({ presentation: VPValidator.or(z.string()) }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { presentation } = input;

            const learnCard = await getEmptyLearnCard();

            const result = await learnCard.invoke.verifyPresentation(
                presentation,
                typeof presentation === 'string' ? { proofFormat: 'jwt' } : {}
            );

            if (
                result.warnings.length === 0 &&
                result.errors.length === 0 &&
                (result.checks.includes('JWS') || result.checks.includes('proof'))
            ) {
                const did =
                    typeof presentation === 'string'
                        ? jwtDecode<DidAuthVP>(presentation).vp.holder
                        : presentation.holder!;

                const user = await getUserForDid(did);

                if (!user) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'User not found',
                    });
                }

                if (!user.associatedDids.includes(did) || user.did !== ctx.user.did) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'Did not associated with user',
                    });
                }

                return setDidAsPrimary(ctx.user.did, did);
            }

            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid DID-Auth VP',
            });
        }),
});
export type UserRouter = typeof userRouter;
