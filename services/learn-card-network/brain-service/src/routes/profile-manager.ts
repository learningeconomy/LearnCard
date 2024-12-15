import crypto from 'crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { LCNProfileValidator } from '@learncard/types';

import { t, profileRoute, profileManagerRoute } from '@routes';
import { getDidWeb, getManagedDidWeb } from '@helpers/did.helpers';
import { createProfileManager } from '@accesslayer/profile-manager/create';
import { checkIfProfileExists } from '@accesslayer/profile/read';

import { ProfileManagerValidator } from 'types/profile-manager';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { createProfile } from '@accesslayer/profile/create';
import { createManagesRelationship } from '@accesslayer/profile-manager/relationships/create';

export const profileManagersRouter = t.router({
    createProfileManager: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile-manager/create',
                tags: ['Profile Managers'],
                summary: 'Create a profile manager',
                description: 'Creates a profile manager',
            },
        })
        .input(ProfileManagerValidator.omit({ id: true }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const manager = await createProfileManager(input);

            await manager.relateTo({
                alias: 'administratedBy',
                where: { profileId: ctx.user.profile.profileId },
            });

            if (manager) return getManagedDidWeb(ctx.domain, manager.id);

            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occured, please try again later.',
            });
        }),

    createManagedProfile: profileManagerRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/create-managed-profile',
                tags: ['Profiles', 'Profile Managers'],
                summary: 'Create a managed profile',
                description: 'Creates a managed profile',
            },
        })
        .input(LCNProfileValidator.omit({ did: true }))
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const profileExists = await checkIfProfileExists(input);

            if (profileExists) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Profile already exists!',
                });
            }

            const randomSeed = crypto.randomBytes(32).toString('hex');

            const managedLearnCard = await getLearnCard(randomSeed);

            const profile = await createProfile({ ...input, did: managedLearnCard.id.did() });

            if (!profile) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occured, please try again later.',
                });
            }

            await createManagesRelationship(ctx.user.manager.id, profile.profileId);

            return getDidWeb(ctx.domain, profile.profileId);
        }),
});
export type ProfileManagersRouter = typeof profileManagersRouter;
