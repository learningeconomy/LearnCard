import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { LCNProfileValidator } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import {
    connectProfiles,
    getConnectionRequests,
    getConnections,
    getPendingConnections,
    requestConnection,
} from '@helpers/connection.helpers';
import { getDidWeb, updateDidForProfile } from '@helpers/did.helpers';

import { createProfile } from '@accesslayer/profile/create';
import { deleteProfile } from '@accesslayer/profile/delete';
import {
    checkIfProfileExists,
    getProfileByDid,
    getProfileByEmail,
    getProfileByHandle,
    searchProfiles,
} from '@accesslayer/profile/read';

import { t, openRoute, didAndChallengeRoute, openProfileRoute, profileRoute } from '@routes';

import cache from '@helpers/redis.helpers';

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
        .input(LCNProfileValidator.omit({ did: true, isServiceProfile: true }))
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const profileExists = await checkIfProfileExists({
                ...input,
                isServiceProfile: false,
                did: ctx.user.did,
            });

            if (profileExists) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Profile already exists!',
                });
            }

            const profile = await createProfile({ ...input, did: ctx.user.did });

            if (profile) return getDidWeb(ctx.domain, profile.handle);

            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occured, please try again later.',
            });
        }),

    createServiceProfile: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/create-service',
                tags: ['Profiles'],
                summary: 'Create a service profile',
                description: 'Creates a service profile',
            },
        })
        .input(LCNProfileValidator.omit({ did: true, isServiceProfile: true }))
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const profileExists = await checkIfProfileExists({ ...input, did: ctx.user.did });

            if (profileExists) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Profile already exists!',
                });
            }

            const profile = await createProfile({
                ...input,
                isServiceProfile: true,
                did: ctx.user.did,
            });

            if (profile) return getDidWeb(ctx.domain, profile.handle);

            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'An unexpected error occured, please try again later.',
            });
        }),

    getProfile: openProfileRoute
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
            return updateDidForProfile(ctx.domain, ctx.user.profile);
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
            const profile = await getProfileByHandle(input.handle);

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
            z.object({
                input: z.string(),
                limit: z.number().int().positive().lt(100).default(25),
                includeSelf: z.boolean().default(false),
            })
        )
        .output(LCNProfileValidator.array())
        .query(async ({ ctx, input }) => {
            const { input: searchInput, limit, includeSelf } = input;

            const profile = ctx.user && !includeSelf && (await getProfileByDid(ctx.user.did));

            const profiles = await searchProfiles(searchInput, {
                limit,
                blacklist: profile ? [profile.handle] : [],
            });

            return profiles.map(profile => updateDidForProfile(ctx.domain, profile));
        }),

    updateProfile: profileRoute
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
        .input(LCNProfileValidator.omit({ did: true, isServiceProfile: true }).partial())
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { handle, displayName, image, email } = input;

            if (handle) {
                const profileExists = await getProfileByHandle(handle);

                if (profileExists) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Handle already in use!',
                    });
                }
                profile.handle = handle.toLowerCase();
            }

            if (email) {
                const profileExists = await getProfileByEmail(email);

                if (profileExists) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Email already in use!',
                    });
                }

                profile.email = email;
            }

            if (image) profile.image = image;
            if (displayName) profile.displayName = displayName;

            await profile.save();

            return true;
        }),

    deleteProfile: profileRoute
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
            await deleteProfile(ctx.user.profile);

            return true;
        }),

    connectWith: profileRoute
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
            const { profile } = ctx.user;
            const { handle } = input;

            const targetProfile = await getProfileByHandle(handle);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return requestConnection(profile, targetProfile);
        }),

    connectWithInvite: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{handle}/connect/{challenge}',
                tags: ['Profiles'],
                summary: 'Connect using an invitation',
                description: 'Connects with another profile using an invitation challenge',
            },
        })
        .input(z.object({ handle: z.string(), challenge: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { handle, challenge } = input;

            const cacheKey = `inviteChallenge:${handle}:${challenge}`;

            if ((await cache.get(cacheKey)) !== 'valid') {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Challenge not found for ${handle}`,
                });
            }

            const targetProfile = await getProfileByHandle(handle);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return connectProfiles(profile, targetProfile, false);
        }),

    acceptConnectionRequest: profileRoute
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
            const { profile } = ctx.user;
            const { handle } = input;

            const targetProfile = await getProfileByHandle(handle);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return connectProfiles(profile, targetProfile);
        }),

    connections: profileRoute
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
            const connections = await getConnections(ctx.user.profile);

            return connections.map(connection => updateDidForProfile(ctx.domain, connection));
        }),

    pendingConnections: profileRoute
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
            const connections = await getPendingConnections(ctx.user.profile);

            return connections.map(connection => updateDidForProfile(ctx.domain, connection));
        }),

    connectionRequests: profileRoute
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
            const connections = await getConnectionRequests(ctx.user.profile);

            return connections.map(connection => updateDidForProfile(ctx.domain, connection));
        }),

    generateInvite: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/generate-invite',
                tags: ['Profiles'],
                summary: 'Generate a connection invitation',
                description:
                    'This route creates a one-time challenge that an unknown profile can use to connect with this account',
            },
        })
        .input(z.object({ challenge: z.string().optional() }).optional())
        .output(z.object({ handle: z.string(), challenge: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { challenge = uuid() } = input ?? {};

            const cacheKey = `inviteChallenge:${profile.handle}:${challenge}`;

            if (await cache.get(cacheKey)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Challenge already in use!',
                });
            }

            await cache.set(`inviteChallenge:${profile.handle}:${challenge}`, 'valid');

            return { handle: profile.handle, challenge };
        }),

    registerSigningAuthority: profileRoute
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
