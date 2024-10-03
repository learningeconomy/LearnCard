import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import jwtDecode from 'jwt-decode';

import { t, didAndChallengeRoute } from '@routes';
import { getAllDidsForDid, getUserForDid } from '@accesslayer/user/read';
import { VPValidator } from '@learncard/types';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { DidAuthVP } from 'types/vp';
import { addDidToUser, removeDidFromUser, setDidAsPrimary } from '@accesslayer/user/update';
import { ensureUserForDid } from '@accesslayer/user/create';
import { deleteUserByDid } from '@accesslayer/user/delete';
import { client, mongodb } from '@mongo';

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
            const session = client.startSession();

            return session.withTransaction(async () => {
                return getAllDidsForDid(ctx.user.did, session);
            });
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

                if (existing && !existing.dids.includes(did)) {
                    // If existing user is only a very simple user with just the one did as primary
                    // and no associated dids, then it was probably made by accident prior to this call!
                    //
                    // We can safely just delete that user for now, though in the future we may want
                    // to add a more robust check
                    //
                    // Otherwise, we should throw an error here to prevent accidentally screwing up
                    // existing users!
                    if (existing.associatedDids.length > 0) {
                        throw new TRPCError({
                            code: 'CONFLICT',
                            message: 'Did is already associated with a user',
                        });
                    }

                    await deleteUserByDid(did);
                }

                const user = await ensureUserForDid(ctx.user.did);

                return !user.dids.includes(did) && (await addDidToUser(user.did, did));
            }

            console.warn('Invalid DidAuthVP when trying to add did!', result, presentation);

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

                const user = await getUserForDid(ctx.user.did);

                if (!user) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'User not found',
                    });
                }

                if (!user.dids.includes(did)) {
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
