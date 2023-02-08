import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { LCNProfileValidator } from '@learncard/types';

import { Profile } from '@models';

import {
    connectProfiles,
    getConnectionRequests,
    getConnections,
    getPendingConnections,
    requestConnection,
} from '@helpers/connection.helpers';
import { getDidWeb, updateDidForProfile } from '@helpers/did.helpers';

import { checkIfProfileExists, searchProfiles } from '@accesslayer/profile/read';

import { t, openRoute, didRoute, didAndChallengeRoute } from '@routes';

export const profilesRouter = t.router({
    createProfile: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/create',
                tags: ['Profiles'],
                summary: 'Create a profile',
                description: 'Creates a profile for a user',
            },
        })
        .input(LCNProfileValidator.omit({ did: true }))
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const profileExists = await checkIfProfileExists({ ...input, did: ctx.user.did });

            if (profileExists) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Profile already exists!',
                });
            }

            const profile = await Profile.createOne({ ...input, did: ctx.user.did });

            if (profile) return getDidWeb(ctx.domain, profile.handle);

            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occured, please try again later.',
            });
        }),

    getProfile: didRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile',
                tags: ['Profiles'],
                summary: 'Get your profile information',
                description:
                    'This route uses the request header to grab the profile of the current user',
            },
        })
        .input(z.void())
        .output(LCNProfileValidator)
        .query(async ({ ctx }) => {
            const profile = await Profile.findOne({ where: { did: ctx.user.did } });

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Please make a profile!',
                });
            }

            return updateDidForProfile(ctx.domain, profile);
        }),

    getOtherProfile: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/profile/{handle}',
                tags: ['Profiles'],
                summary: 'Get profile information',
                description:
                    'This route grabs the profile information of any user, using their handle',
            },
        })
        .input(z.object({ handle: z.string() }))
        .output(LCNProfileValidator.optional())
        .query(async ({ ctx, input }) => {
            const profile = await Profile.findOne({ where: { handle: input.handle } });

            return profile ? updateDidForProfile(ctx.domain, profile) : undefined;
        }),

    searchProfiles: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/search/profiles/{input}',
                tags: ['Profiles'],
                summary: 'Search profiles',
                description: 'This route searches for profiles based on their handle',
            },
        })
        .input(
            z.object({ input: z.string(), limit: z.number().int().positive().lt(100).default(25) })
        )
        .output(LCNProfileValidator.array())
        .query(async ({ ctx, input }) => {
            const profiles = await searchProfiles(input.input, input.limit);

            return profiles.map(profile => updateDidForProfile(ctx.domain, profile));
        }),

    updateProfile: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile',
                tags: ['Profiles'],
                summary: 'Update your profile',
                description: 'This route updates the profile of the current user',
            },
        })
        .input(LCNProfileValidator.omit({ did: true }).partial())
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const did = ctx.user.did;
            const profile = await Profile.findOne({ where: { did } });

            const { handle, image, email } = input;

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Please make a profile!',
                });
            }

            if (handle) {
                const profileExists = await checkIfProfileExists({ handle });

                if (profileExists) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Handle already in use!',
                    });
                }
                profile.handle = handle;
            }

            if (email) {
                const profileExists = await Profile.findOne({ where: { email } });

                if (profileExists) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Email already in use!',
                    });
                }

                profile.email = email;
            }

            if (image) profile.image = image;

            await profile.save();

            return true;
        }),

    deleteProfile: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/profile',
                tags: ['Profiles'],
                summary: 'Delete your profile',
                description: 'This route deletes the profile of the current user',
            },
        })
        .input(z.void())
        .output(z.boolean())
        .mutation(async ({ ctx }) => {
            const did = ctx.user.did;
            const profile = await Profile.findOne({ where: { did } });

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Please make a profile!',
                });
            }

            await profile.delete();

            return true;
        }),

    connectWith: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{handle}/connect',
                tags: ['Profiles'],
                summary: 'Connect with another profile',
                description:
                    'This route uses the request header to send a connection request to another user based on their handle',
            },
        })
        .input(z.object({ handle: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const did = ctx.user.did;
            const { handle } = input;

            const profile = await Profile.findOne({ where: { did } });
            const targetProfile = await Profile.findOne({ where: { handle } });

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Please make a profile!',
                });
            }

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return requestConnection(profile, targetProfile);
        }),

    acceptConnectionRequest: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{handle}/accept-connection',
                tags: ['Profiles'],
                summary: 'Accept Connection Request',
                description:
                    'This route uses the request header to accept a connection request from another user based on their handle',
            },
        })
        .input(z.object({ handle: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const did = ctx.user.did;
            const { handle } = input;

            const profile = await Profile.findOne({ where: { did } });
            const targetProfile = await Profile.findOne({ where: { handle } });

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Please make a profile!',
                });
            }

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return connectProfiles(profile, targetProfile);
        }),

    connections: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/connections',
                tags: ['Profiles'],
                summary: 'View connections',
                description: "This route shows the current user's connections",
            },
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const did = ctx.user.did;

            const profile = await Profile.findOne({ where: { did } });

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Please make a profile!',
                });
            }

            const connections = await getConnections(profile);

            return connections.map(connection => updateDidForProfile(ctx.domain, connection));
        }),

    pendingConnections: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/pending-connections',
                tags: ['Profiles'],
                summary: 'View pending connections',
                description: "This route shows the current user's pending connections",
            },
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const did = ctx.user.did;

            const profile = await Profile.findOne({ where: { did } });

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Please make a profile!',
                });
            }

            const connections = await getPendingConnections(profile);

            return connections.map(connection => updateDidForProfile(ctx.domain, connection));
        }),

    connectionRequests: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/connection-requests',
                tags: ['Profiles'],
                summary: 'View connection requests',
                description: "This route shows the current user's connection requests",
            },
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const did = ctx.user.did;

            const profile = await Profile.findOne({ where: { did } });

            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Please make a profile!',
                });
            }

            const connections = await getConnectionRequests(profile);

            return connections.map(connection => updateDidForProfile(ctx.domain, connection));
        }),

    registerSigningAuthority: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/signing-authority/register',
                tags: ['Profiles'],
                summary: 'Register a Signing Authority',
                description:
                    "This route is used to register a signing authority that can sign credentials on the current user's behalf",
            },
        })
        .input(z.object({ signingAuthority: z.string() }))
        .output(z.boolean())
        .mutation(async () => {
            return false;
        }),
});
export type ProfilesRouter = typeof profilesRouter;
