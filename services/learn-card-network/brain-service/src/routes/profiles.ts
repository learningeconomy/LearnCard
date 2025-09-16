import crypto from 'crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    LCNProfileValidator,
    LCNProfileConnectionStatusEnum,
    PaginatedLCNProfilesValidator,
    PaginatedLCNProfilesAndManagersValidator,
    PaginationOptionsValidator,
} from '@learncard/types';
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
import {
    getDidWeb,
    getManagedDidWeb,
    updateDidForProfile,
    updateDidForProfiles,
} from '@helpers/did.helpers';

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
    getPrimarySigningAuthorityForUser,
    getSigningAuthoritiesForUser,
    getSigningAuthorityForUserByName,
} from '@accesslayer/signing-authority/relationships/read';
import { ProfileType, SigningAuthorityForUserValidator } from 'types/profile';

import { t, openRoute, didAndChallengeRoute, profileRoute, didRoute } from '@routes';

import { transformProfileId } from '@helpers/profile.helpers';
import { deleteDidDocForProfile } from '@cache/did-docs';
import {
    isInviteAlreadySetForProfile,
    isInviteValidForProfile,
    setValidInviteForProfile,
    invalidateInvite,
    getValidInvitesForProfile,
    consumeInviteUseForProfile,
} from '@cache/invites';
import { getLearnCard } from '@helpers/learnCard.helpers';
import {
    getManagedServiceProfiles,
    getProfilesThatAProfileManages,
} from '@accesslayer/profile/relationships/read';
import { createProfileManagedByRelationship } from '@accesslayer/profile/relationships/create';
import { updateProfile } from '@accesslayer/profile/update';
import { LCNProfileQueryValidator } from '@learncard/types';
import { setPrimarySigningAuthority } from '@accesslayer/signing-authority/relationships/update';

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
            requiredScope: 'profiles:write',
        })
        .input(
            LCNProfileValidator.extend({ approved: z.boolean().optional() }).omit({
                did: true,
                isServiceProfile: true,
            })
        )
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
            requiredScope: 'profiles:write',
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

    createManagedServiceProfile: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/create-managed-service',
                tags: ['Profiles'],
                summary: 'Create a managed service profile',
                description: 'Creates a managed service profile',
            },
            requiredScope: 'profiles:write',
        })
        .input(LCNProfileValidator.omit({ did: true, isServiceProfile: true }))
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profileId } = input;
            const profileExists = await checkIfProfileExists({ profileId });

            if (profileExists) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Profile already exists!',
                });
            }

            const randomSeed = crypto.randomBytes(32).toString('hex');

            const spLearnCard = await getLearnCard(randomSeed);

            const profile = await createProfile({
                ...input,
                isServiceProfile: true,
                did: spLearnCard.id.did(),
            });

            if (!profile) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occured, please try again later.',
                });
            }

            await createProfileManagedByRelationship(ctx.user.profile, profile);

            return getDidWeb(ctx.domain, profile.profileId);
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
        .output(LCNProfileValidator.optional())
        .query(async ({ ctx }) => {
            if (!ctx.user.profile) return undefined;
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

            const selfProfile = ctx.user?.did ? await getProfileByDid(ctx.user.did) : null;
            const otherProfile = await getProfileByProfileId(profileId);

            if (!otherProfile) return undefined;

            if (selfProfile && (await isRelationshipBlocked(selfProfile, otherProfile))) {
                return undefined;
            }

            const profile = updateDidForProfile(ctx.domain, otherProfile);

            const isViewingSelf = selfProfile?.profileId === profile.profileId;

            if (!isViewingSelf) {
                const { dob: _dob, ...sanitizedProfile } = profile;
                return sanitizedProfile;
            }

            return profile;
        }),

    getAvailableProfiles: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/profile/available-profiles',
                tags: ['Profiles'],
                summary: 'Available Profiles',
                description:
                    'This route gets all of your available profiles. That is, profiles you directly or indirectly manage',
            },
            requiredScope: 'profiles:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                query: LCNProfileQueryValidator.optional(),
            }).default({})
        )
        .output(PaginatedLCNProfilesAndManagersValidator)
        .query(async ({ ctx, input }) => {
            const { query, limit, cursor } = input;

            const results = await getProfilesThatAProfileManages(ctx.user.profile.profileId, {
                limit: limit + 1,
                cursor,
                query,
            });

            const profiles = results.map(result => ({
                profile: updateDidForProfile(ctx.domain, result.profile),
                ...(result.manager && {
                    manager: {
                        ...result.manager,
                        did: getManagedDidWeb(ctx.domain, result.manager.id),
                    },
                }),
            }));
            const hasMore = results.length > limit;
            const nextCursor = hasMore ? results.at(-2)?.profile.profileId : undefined;

            return {
                hasMore,
                ...(nextCursor && { cursor: nextCursor }),
                records: profiles.slice(0, limit),
            };
        }),

    getManagedServiceProfiles: profileRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/profile/managed-services',
                tags: ['Profiles'],
                summary: 'Managed Service Profiles',
                description: 'This route gets all of your managed service profiles',
            },
            requiredScope: 'profiles:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                id: z.string().optional(),
                limit: PaginationOptionsValidator.shape.limit.default(25),
            }).default({})
        )
        .output(PaginatedLCNProfilesValidator)
        .query(async ({ ctx, input }) => {
            const { id = '', limit, cursor } = input;

            const results = await getManagedServiceProfiles(ctx.user.profile.profileId, {
                limit: limit + 1,
                cursor,
                targetId: id,
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
            requiredScope: 'profiles:write',
        })
        .input(
            LCNProfileValidator.extend({ approved: z.boolean().optional() })
                .omit({ did: true, isServiceProfile: true })
                .partial()
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const {
                profileId,
                displayName,
                shortBio,
                bio,
                isPrivate,
                image,
                heroImage,
                websiteLink,
                type,
                email,
                notificationsWebhook,
                display,
                role,
                dob,
                country,
                highlightedCredentials,
                approved,
            } = input;

            const actualUpdates: Partial<ProfileType> = {};

            if (profileId) {
                const profileExists = await getProfileByProfileId(profileId);

                if (profileExists) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'profileId already in use!',
                    });
                }

                await deleteDidDocForProfile(profileId);

                actualUpdates.profileId = transformProfileId(profileId);
            }

            if (email) {
                const profileExists = await getProfileByEmail(email);

                if (profileExists) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: 'Email already in use!',
                    });
                }

                actualUpdates.email = email;
            }

            if (image) actualUpdates.image = image;
            if (displayName) actualUpdates.displayName = displayName;
            if (shortBio) actualUpdates.shortBio = shortBio;
            if (isPrivate) actualUpdates.isPrivate = isPrivate;
            if (bio) actualUpdates.bio = bio;
            if (heroImage) actualUpdates.heroImage = heroImage;
            if (websiteLink) actualUpdates.websiteLink = websiteLink;
            if (type) actualUpdates.type = type;
            if (notificationsWebhook) actualUpdates.notificationsWebhook = notificationsWebhook;
            if (display) actualUpdates.display = display;
            if (role) actualUpdates.role = role;
            if (dob) actualUpdates.dob = dob;
            if (country) actualUpdates.country = country;
            if (highlightedCredentials)
                actualUpdates.highlightedCredentials = highlightedCredentials;
            if (typeof approved === 'boolean') actualUpdates.approved = approved;

            return updateProfile(profile, actualUpdates);
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
            requiredScope: 'profiles:delete',
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
            requiredScope: 'profiles:write',
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
            requiredScope: 'profiles:write',
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
                description: 'Connects with another profile using an invitation challenge. Respects invite usage and expiration; succeeds while the invite is valid (usesRemaining is null or > 0) and not expired. Returns 404 if the invite is invalid or expired.',
            },
            requiredScope: 'profiles:write',
        })
        .input(z.object({ profileId: z.string(), challenge: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, challenge } = input;

            const isValid = await isInviteValidForProfile(profileId, challenge);

            if (!isValid) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Invite not found or has expired',
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
                await consumeInviteUseForProfile(profileId, challenge);
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
            requiredScope: 'profiles:write',
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
            requiredScope: 'profiles:write',
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
                deprecated: true,
                description:
                    "This route shows the current user's connections.\nWarning! This route is deprecated and currently has a hard limit of returning only the first 50 connections. Please use paginatedConnections instead!",
            },
            requiredScope: 'connections:read',
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const _connections = await getConnections(ctx.user.profile, { limit: 50 });

            const connections = _connections.map(connection =>
                updateDidForProfile(ctx.domain, connection)
            );

            return connections;
        }),

    paginatedConnections: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/connections/paginated',
                tags: ['Profiles'],
                summary: 'View connections',
                description: "This route shows the current user's connections",
            },
            requiredScope: 'connections:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
            }).default({})
        )
        .output(PaginatedLCNProfilesValidator)
        .query(async ({ ctx, input }) => {
            const { limit, cursor } = input;

            const records = await getConnections(ctx.user.profile, { limit: limit + 1, cursor });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.profileId;

            return {
                hasMore: records.length > limit,
                records: updateDidForProfiles(ctx.domain, records).slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    pendingConnections: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/pending-connections',
                tags: ['Profiles'],
                summary: 'View pending connections',
                deprecated: true,
                description:
                    "This route shows the current user's pending connections.\nWarning! This route is deprecated and currently has a hard limit of returning only the first 50 connections. Please use paginatedPendingConnections instead",
            },
            requiredScope: 'connections:read',
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const connections = await getPendingConnections(ctx.user.profile, { limit: 50 });

            return connections.map(connection => updateDidForProfile(ctx.domain, connection));
        }),

    paginatedPendingConnections: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/pending-connections/paginated',
                tags: ['Profiles'],
                summary: 'View pending connections',
                description: "This route shows the current user's pending connections",
            },
            requiredScope: 'connections:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
            }).default({})
        )
        .output(PaginatedLCNProfilesValidator)
        .query(async ({ ctx, input }) => {
            const { limit, cursor } = input;

            const records = await getPendingConnections(ctx.user.profile, {
                limit: limit + 1,
                cursor,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.displayName;

            return {
                hasMore: records.length > limit,
                records: updateDidForProfiles(ctx.domain, records).slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    connectionRequests: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/connection-requests',
                tags: ['Profiles'],
                summary: 'View connection requests',
                deprecated: true,
                description:
                    "This route shows the current user's connection requests.\nWarning! This route is deprecated and currently has a hard limit of returning only the first 50 connections. Please use paginatedConnectionRequests instead",
            },
            requiredScope: 'connections:read',
        })
        .input(z.void())
        .output(LCNProfileValidator.array())
        .query(async ({ ctx }) => {
            const connections = await getConnectionRequests(ctx.user.profile, { limit: 50 });

            return connections.map(connection => updateDidForProfile(ctx.domain, connection));
        }),

    paginatedConnectionRequests: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/connection-requests/paginated',
                tags: ['Profiles'],
                summary: 'View connection requests',
                description: "This route shows the current user's connection requests",
            },
            requiredScope: 'connections:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
            }).default({})
        )
        .output(PaginatedLCNProfilesValidator)
        .query(async ({ ctx, input }) => {
            const { limit, cursor } = input;

            const records = await getConnectionRequests(ctx.user.profile, {
                limit: limit + 1,
                cursor,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.displayName;

            return {
                hasMore: records.length > limit,
                records: updateDidForProfiles(ctx.domain, records).slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
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
                    'Generate a connection invitation challenge. By default, invites are single-use; set maxUses > 1 for multi-use, or maxUses = 0 for unlimited. Expiration is in seconds (default 30 days); set expiration = 0 for no expiration.',
            },
            requiredScope: 'connections:write',
        })
        .input(
            z
                .object({
                    expiration: z
                        .number()
                        .optional()
                        .default(30 * 24 * 3600), // Default to 30 days in seconds
                    challenge: z.string().optional(),
                    maxUses: z
                        .number()
                        .int()
                        .min(0)
                        .optional()
                        .default(1) // Default single-use invites
                })
                .optional()
                .default({})
        )
        .output(
            z.object({
                profileId: z.string(),
                challenge: z.string(),
                expiresIn: z.number().nullable(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            if (!profile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Please create a profile first.',
                });
            }

            const { expiration = 3600, challenge: inputChallenge, maxUses } = input; // expiration now in seconds by default

            // Use UUID for challenge if none is provided
            const challenge = inputChallenge || uuid();

            const isAlreadySet = await isInviteAlreadySetForProfile(profile.profileId, challenge);

            if (isAlreadySet) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Challenge already in use!',
                });
            }

            let expiresIn: number | null = expiration === 0 ? null : expiration;

            // Set the invite with the calculated expiration time and usage limits
            await setValidInviteForProfile(profile.profileId, challenge, expiresIn ?? null, maxUses);

            return { profileId: profile.profileId, challenge, expiresIn };
        }),

    // List all valid invites for the current user
    listInvites: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/invites',
                tags: ['Profiles'],
                summary: 'List valid connection invitations',
                description: "List all valid connection invitation links you've created. Each item includes: challenge, expiresIn (seconds or null), usesRemaining (number or null), and maxUses (number or null). Exhausted invites are omitted.",
            },
            requiredScope: 'connections:read',
        })
        .input(z.void())
        .output(
            z
                .object({
                    challenge: z.string(),
                    expiresIn: z.number().nullable(),
                    usesRemaining: z.number().nullable(),
                    maxUses: z.number().nullable(),
                })
                .array()
        )
        .query(async ({ ctx }) => {
            const invites = await getValidInvitesForProfile(ctx.user.profile.profileId);

            return invites;
        }),

    // Invalidate a specific invite by challenge for the current user
    invalidateInvite: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/invite/{challenge}/invalidate',
                tags: ['Profiles'],
                summary: 'Invalidate an invitation',
                description: 'Invalidate a specific connection invitation by its challenge string. Idempotent: returns true even if the invite was already invalid or missing.',
            },
            requiredScope: 'connections:write',
        })
        .input(z.object({ challenge: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { challenge } = input;

            await invalidateInvite(ctx.user.profile.profileId, challenge);

            return true;
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
            requiredScope: 'connections:write',
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
            requiredScope: 'connections:write',
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
            requiredScope: 'connections:read',
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
            requiredScope: 'signingAuthorities:write',
        })
        .input(
            z.object({
                endpoint: z.string(),
                name: z
                    .string()
                    .max(15)
                    .regex(/^[a-z0-9-]+$/, {
                        message:
                            'The input string must contain only lowercase letters, numbers, and hyphens.',
                    }),
                did: z.string(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { endpoint, name, did } = input;

            const existingSas = await getSigningAuthoritiesForUser(ctx.user.profile);
            const setAsPrimary = existingSas.length === 0;

            const sa = await upsertSigningAuthority(endpoint);
            await createUseSigningAuthorityRelationship(
                ctx.user.profile,
                sa,
                name,
                did,
                setAsPrimary
            );
            await deleteDidDocForProfile(ctx.user.profile.profileId);
            return true;
        }),

    signingAuthorities: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/signing-authority/get/all',
                tags: ['Profiles'],
                summary: 'Get Signing Authorities for user',
                description:
                    "This route is used to get registered signing authorities that can sign credentials on the current user's behalf",
            },
            requiredScope: 'signingAuthorities:read',
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
                path: '/profile/signing-authority/get',
                tags: ['Profiles'],
                summary: 'Get Signing Authority for user',
                description:
                    "This route is used to get a named signing authority that can sign credentials on the current user's behalf",
            },
            requiredScope: 'signingAuthorities:read',
        })
        .input(z.object({ endpoint: z.string(), name: z.string() }))
        .output(SigningAuthorityForUserValidator.or(z.undefined()))
        .query(async ({ ctx, input }) => {
            return getSigningAuthorityForUserByName(ctx.user.profile, input.endpoint, input.name);
        }),

    setPrimarySigningAuthority: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/signing-authority/set-primary',
                tags: ['Profiles'],
                summary: 'Set Primary Signing Authority',
                description:
                    'This route is used to set a signing authority as the primary one for the current user',
            },
            requiredScope: 'signingAuthorities:write',
        })
        .input(
            z.object({
                endpoint: z.string(),
                name: z
                    .string()
                    .max(15)
                    .regex(/^[a-z0-9-]+$/, {
                        message:
                            'The input string must contain only lowercase letters, numbers, and hyphens.',
                    }),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { endpoint, name } = input;

            const sa = await getSigningAuthorityForUserByName(ctx.user.profile, endpoint, name);

            if (!sa) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Signing authority not found or owned by user.',
                });
            }

            await setPrimarySigningAuthority(ctx.user.profile, endpoint, name);
            await deleteDidDocForProfile(ctx.user.profile.profileId);
            return true;
        }),
    primarySigningAuthority: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/signing-authority/get-primary',
                tags: ['Profiles'],
                summary: 'Get primary Signing Authority for user',
                description:
                    "This route is used to get the primary signing authority that can sign credentials on the current user's behalf",
            },
            requiredScope: 'signingAuthorities:read',
        })
        .input(z.void())
        .output(SigningAuthorityForUserValidator.or(z.undefined()))
        .query(async ({ ctx }) => {
            return getPrimarySigningAuthorityForUser(ctx.user.profile);
        }),
});
export type ProfilesRouter = typeof profilesRouter;
