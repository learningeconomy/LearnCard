import crypto from 'crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    LCNProfileManagerValidator,
    LCNProfileQueryValidator,
    LCNProfileValidator,
    PaginatedLCNProfilesValidator,
    PaginationOptionsValidator,
} from '@learncard/types';

import { t, profileRoute, profileManagerRoute, openProfileManagerRoute, openRoute } from '@routes';
import { getDidWeb, getManagedDidWeb, updateDidForProfile } from '@helpers/did.helpers';
import { createProfileManager } from '@accesslayer/profile-manager/create';
import { checkIfProfileExists } from '@accesslayer/profile/read';

import { ProfileManagerType, ProfileManagerValidator } from 'types/profile-manager';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { createProfile } from '@accesslayer/profile/create';
import { createManagesRelationship } from '@accesslayer/profile-manager/relationships/create';
import { deleteManagesRelationship } from '@accesslayer/profile-manager/relationships/delete';
import { getBoostByUri } from '@accesslayer/boost/read';
import { getManagedProfiles, getProfilesManagedByProfile } from '@accesslayer/profile-manager/relationships/read';
import { getProfilesThatManageAProfile } from '@accesslayer/profile/relationships/read';
import { updateProfileManager } from '@accesslayer/profile-manager/update';
import { getProfileManagerById } from '@accesslayer/profile-manager/read';

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
            requiredScope: 'profileManagers:write',
        })
        .input(ProfileManagerValidator.omit({ id: true, created: true }))
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

    createChildProfileManager: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile-manager/create-child',
                tags: ['Profile Managers'],
                summary: 'Create a profile manager that is a child of a Boost',
                description: 'Creates a profile manager that is a child of a Boost',
            },
            requiredScope: 'profileManagers:write',
        })
        .input(
            z.object({
                parentUri: z.string(),
                profile: ProfileManagerValidator.omit({ id: true, created: true }),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { parentUri, profile } = input;

            const parentBoost = await getBoostByUri(parentUri);

            if (!parentBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find parent boost' });
            }

            const manager = await createProfileManager(profile);

            await Promise.all([
                manager.relateTo({ alias: 'childOf', where: { id: parentBoost.id } }),
                manager.relateTo({
                    alias: 'administratedBy',
                    where: { profileId: ctx.user.profile.profileId },
                }),
            ]);

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
            requiredScope: 'profileManagers:write',
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

    getManagedProfiles: profileManagerRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/profile/managed-profiles',
                tags: ['Profiles', 'Profile Managers'],
                summary: 'Managed Profiles',
                description: 'This route gets all of your managed profiles',
            },
            requiredScope: 'profileManagers:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                query: LCNProfileQueryValidator.optional(),
            }).default({ limit: 25 })
        )
        .output(PaginatedLCNProfilesValidator)
        .query(async ({ ctx, input }) => {
            const { query, limit, cursor } = input;

            const results = await getManagedProfiles(ctx.user.manager, {
                limit: limit + 1,
                cursor,
                query,
            });

            const profiles = results.map(profile => updateDidForProfile(ctx.domain, profile));
            const hasMore = results.length > limit;
            const nextCursor = hasMore ? results.at(-2)?.profileId : undefined;

            return {
                hasMore,
                ...(nextCursor && { cursor: nextCursor }),
                records: profiles.slice(0, limit),
            };
        }),

    getMyManagedChildren: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile-manager/my-managed-children',
                tags: ['Profile Managers'],
                summary: 'Get profiles managed by the current user',
                description:
                    'Returns all profiles managed via ProfileManagers that the current profile administrates.',
            },
            requiredScope: 'profileManagers:read',
        })
        .input(z.void())
        .output(z.array(LCNProfileValidator))
        .query(async ({ ctx }) => {
            return getProfilesManagedByProfile(ctx.user.profile.profileId);
        }),

    getMyGuardians: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile-manager/my-guardians',
                tags: ['Profile Managers'],
                summary: 'Get profiles that manage the current user',
                description:
                    'Returns all profiles that manage the current profile via a MANAGES relationship.',
            },
            requiredScope: 'profileManagers:read',
        })
        .input(z.void())
        .output(z.array(LCNProfileValidator))
        .query(async ({ ctx }) => {
            return getProfilesThatManageAProfile(ctx.user.profile.profileId);
        }),

    removeManagesRelationship: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile-manager/remove-manages',
                tags: ['Profile Managers'],
                summary: 'Remove a MANAGES relationship',
                description:
                    'Removes the MANAGES relationship between the current profile and a child profile, or between a guardian and the current profile.',
            },
            requiredScope: 'profileManagers:write',
        })
        .input(z.object({ profileId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const myProfileId = ctx.user.profile.profileId;
            const { profileId: targetProfileId } = input;

            // Try removing as guardian (I manage targetProfileId)
            const removedAsGuardian = await deleteManagesRelationship(myProfileId, targetProfileId);
            if (removedAsGuardian) return true;

            // Try removing as child (targetProfileId manages me)
            const removedAsChild = await deleteManagesRelationship(targetProfileId, myProfileId);
            if (removedAsChild) return true;

            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No MANAGES relationship found between these profiles.',
            });
        }),

    getProfileManager: openProfileManagerRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile-manager',
                tags: ['Profile Managers'],
                summary: 'Get your profile manager profile information',
                description:
                    'This route uses the request header to grab the profile manager profile of the current profile manager',
            },
            requiredScope: 'profileManagers:read',
        })
        .input(z.void())
        .output(LCNProfileManagerValidator.extend({ did: z.string() }).optional())
        .query(async ({ ctx }) => {
            if (!ctx.user.manager) return undefined;

            return { ...ctx.user.manager, did: getManagedDidWeb(ctx.domain, ctx.user.manager.id) };
        }),

    getOtherProfileManager: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/profile-manager/{id}',
                tags: ['Profile Managers'],
                summary: 'Get profile manager information',
                description:
                    'This route grabs the profile information of any profile manager, using their id',
            },
            requiredScope: 'profileManagers:read',
        })
        .input(z.object({ id: z.string() }))
        .output(LCNProfileManagerValidator.extend({ did: z.string() }).optional())
        .query(async ({ ctx, input }) => {
            const { id } = input;

            const manager = await getProfileManagerById(id);

            if (!manager) return undefined;

            return { ...manager, did: getManagedDidWeb(ctx.domain, manager.id) };
        }),

    updateProfileManager: profileManagerRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile-manager',
                tags: ['Profile Managers'],
                summary: 'Update the profile of your Profile Manager',
                description: 'This route updates the profile of the current profile manager',
            },
            requiredScope: 'profileManagers:write',
        })
        .input(LCNProfileManagerValidator.omit({ id: true, created: true }).partial())
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { manager } = ctx.user;

            const { displayName, shortBio, bio, image, heroImage, email } = input;

            const actualUpdates: Partial<ProfileManagerType> = {};

            if (email) actualUpdates.email = email;
            if (image) actualUpdates.image = image;
            if (displayName) actualUpdates.displayName = displayName;
            if (shortBio) actualUpdates.shortBio = shortBio;
            if (bio) actualUpdates.bio = bio;
            if (heroImage) actualUpdates.heroImage = heroImage;

            return updateProfileManager(manager, actualUpdates);
        }),
});
export type ProfileManagersRouter = typeof profileManagersRouter;
