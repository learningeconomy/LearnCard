import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { LCNProfileValidator, LCNProfileConnectionStatusEnum } from '@learncard/types';
import { v4 as uuid } from 'uuid';

import {
    cancelConnectionRequest,
    connectProfiles,
    disconnectProfiles,
    getConnectionRequests,
    getConnections,
    getPendingConnections,
    requestConnection,
    getConnectionStatus,
    blockProfile,
    getBlockedProfiles,
    unblockProfile,
    getBlockedAndBlockedByIds,
    isRelationshipBlocked,
} from '@helpers/connection.helpers';
import { getDidWeb, updateDidForProfile } from '@helpers/did.helpers';

import { createProfile } from '@accesslayer/profile/create';
import { deleteProfile } from '@accesslayer/profile/delete';
import {
    checkIfProfileExists,
    getProfileByDid,
    getProfileByEmail,
    getProfileByProfileId,
    searchProfiles,
} from '@accesslayer/profile/read';

import { upsertSigningAuthority } from '@accesslayer/signing-authority/create';
import { createUseSigningAuthorityRelationship } from '@accesslayer/signing-authority/relationships/create';
import {
    getSigningAuthoritiesForUser,
    getSigningAuthorityForUserByName,
} from '@accesslayer/signing-authority/relationships/read';
import { SigningAuthorityForUserValidator } from 'types/profile';

import { t, openRoute, didAndChallengeRoute, openProfileRoute, profileRoute } from '@routes';

import { transformProfileId } from '@helpers/profile.helpers';
import { deleteDidDocForProfile } from '@cache/did-docs';
import {
    isInviteAlreadySetForProfile,
    isInviteValidForProfile,
    setValidInviteForProfile,
} from '@cache/invites';
import {
    deleteCachedConnectionsForProfileId,
    getCachedConnectionsByProfileId,
    setCachedConnectionsForProfileId,
} from '@cache/connections';

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

            if (profile) return getDidWeb(ctx.domain, profile.profileId);

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

            if (profile) return getDidWeb(ctx.domain, profile.profileId);

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
                path: '/profile/{profileId}',
                tags: ['Profiles'],
                summary: 'Get profile information',
                description:
                    'This route grabs the profile information of any user, using their profileId',
            },
        })
        .input(z.object({ profileId: z.string() }))
        .output(LCNProfileValidator.optional())
        .query(async ({ ctx, input }) => {
            const { profileId } = input;

            const selfProfile = ctx.user && ctx.user.did && (await getProfileByDid(ctx.user.did));
            const otherProfile = await getProfileByProfileId(profileId);

            if (selfProfile && (await isRelationshipBlocked(selfProfile, otherProfile))) {
                return undefined;
            }
            return otherProfile ? updateDidForProfile(ctx.domain, otherProfile) : undefined;
        }),

    searchProfiles: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/search/profiles/{input}',
                tags: ['Profiles'],
                summary: 'Search profiles',
                description: 'This route searches for profiles based on their profileId',
            },
        })
        .input(
            z.object({
                input: z.string(),
                limit: z.number().int().positive().lt(100).default(25),
                includeSelf: z.boolean().default(false),
                includeConnectionStatus: z.boolean().default(false),
                includeServiceProfiles: z.boolean().default(false),
            })
        )
        .output(
            LCNProfileValidator.extend({
                connectionStatus: LCNProfileConnectionStatusEnum.optional(),
            }).array()
        )
        .query(async ({ ctx, input }) => {
            const {
                input: searchInput,
                limit,
                includeSelf,
                includeConnectionStatus,
                includeServiceProfiles,
            } = input;

            const _selfProfile = ctx.user && ctx.user.did && (await getProfileByDid(ctx.user.did));
            const selfProfile = !includeSelf && _selfProfile;

            const blacklist =
                (_selfProfile && (await getBlockedAndBlockedByIds(_selfProfile))) || [];

            const profiles = await searchProfiles(searchInput, {
                limit,
                blacklist: selfProfile ? [selfProfile.profileId, ...blacklist] : blacklist,
                includeServiceProfiles,
            });
            // TODO: Allow filtering out service profiles
            if (selfProfile && includeConnectionStatus) {
                const profilesWithConnectionStatus = await Promise.all(
                    profiles.map(async profile => {
                        const targetProfileFull = await getProfileByProfileId(profile.profileId);
                        if (targetProfileFull) {
                            return {
                                ...profile,
                                connectionStatus: await getConnectionStatus(
                                    selfProfile,
                                    targetProfileFull
                                ),
                            };
                        }
                        return profile;
                    })
                );
                return profilesWithConnectionStatus.map(profile =>
                    updateDidForProfile(ctx.domain, profile)
                );
            } else {
                return profiles.map(profile => updateDidForProfile(ctx.domain, profile));
            }
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

            const { profileId, displayName, image, email, notificationsWebhook } = input;

            if (profileId) {
                const profileExists = await getProfileByProfileId(profileId);

                if (profileExists) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'profileId already in use!',
                    });
                }

                await deleteDidDocForProfile(profileId);

                profile.profileId = transformProfileId(profileId);
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
            if (notificationsWebhook) profile.notificationsWebhook = notificationsWebhook;

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
            const { profile } = ctx.user;
            await Promise.all([deleteProfile(profile), deleteDidDocForProfile(profile.profileId)]);

            return true;
        }),

    connectWith: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{profileId}/connect',
                tags: ['Profiles'],
                summary: 'Connect with another profile',
                description:
                    'This route uses the request header to send a connection request to another user based on their profileId',
            },
        })
        .input(z.object({ profileId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            const isBlocked = await isRelationshipBlocked(profile, targetProfile);
            if (!targetProfile || isBlocked) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return requestConnection(profile, targetProfile);
        }),

    cancelConnectionRequest: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{profileId}/cancel-connection-request',
                tags: ['Profiles'],
                summary: 'Cancel Connection Request',
                description: 'Cancels connection request with another profile',
            },
        })
        .input(z.object({ profileId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return cancelConnectionRequest(profile, targetProfile);
        }),

    connectWithInvite: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{profileId}/connect/{challenge}',
                tags: ['Profiles'],
                summary: 'Connect using an invitation',
                description: 'Connects with another profile using an invitation challenge',
            },
        })
        .input(z.object({ profileId: z.string(), challenge: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, challenge } = input;

            if (!(await isInviteValidForProfile(profileId, challenge))) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Challenge not found for ${profileId}`,
                });
            }

            const targetProfile = await getProfileByProfileId(profileId);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            const success = await connectProfiles(profile, targetProfile, false);

            if (success) {
                await Promise.all([
                    deleteCachedConnectionsForProfileId(profile.profileId),
                    deleteCachedConnectionsForProfileId(targetProfile.profileId),
                ]);
            }

            return success;
        }),

    disconnectWith: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{profileId}/disconnect',
                tags: ['Profiles'],
                summary: 'Disconnect with another profile',
                description:
                    'This route uses the request header to disconnect with another user based on their profileId',
            },
        })
        .input(z.object({ profileId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return disconnectProfiles(profile, targetProfile);
        }),

    acceptConnectionRequest: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{profileId}/accept-connection',
                tags: ['Profiles'],
                summary: 'Accept Connection Request',
                description:
                    'This route uses the request header to accept a connection request from another user based on their profileId',
            },
        })
        .input(z.object({ profileId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            const success = await connectProfiles(profile, targetProfile);

            if (success) {
                await Promise.all([
                    deleteCachedConnectionsForProfileId(profile.profileId),
                    deleteCachedConnectionsForProfileId(targetProfile.profileId),
                ]);
            }

            return success;
        }),

    connections: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/connections',
                tags: ['Profiles'],
                summary: 'View connections',
                description:
                    "This route shows the current user's connections.\nWarning! This route will soon be deprecated and currently has a hard limit of returning only the first 50 connections",
            },
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const cachedResponse = await getCachedConnectionsByProfileId(
                ctx.user.profile.profileId
            );

            if (cachedResponse) return cachedResponse;

            const _connections = await getConnections(ctx.user.profile, { limit: 50 });

            const connections = _connections.map(connection =>
                updateDidForProfile(ctx.domain, connection)
            );

            await setCachedConnectionsForProfileId(ctx.user.profile.profileId, connections);

            return connections;
        }),

    pendingConnections: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/pending-connections',
                tags: ['Profiles'],
                summary: 'View pending connections',
                description:
                    "This route shows the current user's pending connections.\nWarning! This route will soon be deprecated and currently has a hard limit of returning only the first 50 connections",
            },
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const connections = await getPendingConnections(ctx.user.profile, { limit: 50 });

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
                description:
                    "This route shows the current user's connection requests.\nWarning! This route will soon be deprecated and currently has a hard limit of returning only the first 50 connections",
            },
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const connections = await getConnectionRequests(ctx.user.profile, { limit: 50 });

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
        .output(z.object({ profileId: z.string(), challenge: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { challenge = uuid() } = input ?? {};

            if (await isInviteAlreadySetForProfile(profile.profileId, challenge)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Challenge already in use!',
                });
            }

            await setValidInviteForProfile(profile.profileId, challenge);

            return { profileId: profile.profileId, challenge };
        }),

    blockProfile: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{profileId}/block',
                tags: ['Profiles'],
                summary: 'Block another profile',
                description: 'Block another user based on their profileId',
            },
        })
        .input(z.object({ profileId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            const success = await blockProfile(profile, targetProfile);

            if (success) {
                await Promise.all([
                    deleteCachedConnectionsForProfileId(profile.profileId),
                    deleteCachedConnectionsForProfileId(targetProfile.profileId),
                ]);
            }

            return success;
        }),

    unblockProfile: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/{profileId}/unblock',
                tags: ['Profiles'],
                summary: 'Unblock another profile',
                description: 'Unblock another user based on their profileId',
            },
        })
        .input(z.object({ profileId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            const success = await unblockProfile(profile, targetProfile);

            if (success) {
                await Promise.all([
                    deleteCachedConnectionsForProfileId(profile.profileId),
                    deleteCachedConnectionsForProfileId(targetProfile.profileId),
                ]);
            }

            return success;
        }),

    blocked: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/blocked',
                tags: ['Profiles'],
                summary: 'View blocked profiles',
                description: "This route shows the current user's blocked profiles",
            },
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const blocked = await getBlockedProfiles(ctx.user.profile);

            return blocked.map(blockedProfile => updateDidForProfile(ctx.domain, blockedProfile));
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
        .input(z.object({ endpoint: z.string(), name: z.string(), did: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { endpoint, name, did } = input;
            const sa = await upsertSigningAuthority(endpoint);
            await createUseSigningAuthorityRelationship(ctx.user.profile, sa, name, did);
            await deleteDidDocForProfile(ctx.user.profile.profileId);
            return true;
        }),

    signingAuthorities: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/signing-authority/get',
                tags: ['Profiles'],
                summary: 'Get Signing Authorities for user',
                description:
                    "This route is used to get registered signing authorities that can sign credentials on the current user's behalf",
            },
        })
        .input(z.void())
        .output(SigningAuthorityForUserValidator.array())
        .query(async ({ ctx }) => {
            return getSigningAuthoritiesForUser(ctx.user.profile);
        }),

    signingAuthority: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/signing-authority/get/{endpoint}/{name}',
                tags: ['Profiles'],
                summary: 'Get Signing Authority for user',
                description:
                    "This route is used to get a named signing authority that can sign credentials on the current user's behalf",
            },
        })
        .input(z.object({ endpoint: z.string(), name: z.string() }))
        .output(SigningAuthorityForUserValidator.or(z.undefined()))
        .query(async ({ ctx, input }) => {
            return getSigningAuthorityForUserByName(ctx.user.profile, input.endpoint, input.name);
        }),
});
export type ProfilesRouter = typeof profilesRouter;
