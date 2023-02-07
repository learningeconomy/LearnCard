import { initTRPC, TRPCError } from '@trpc/server';
import { APIGatewayEvent, CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import { OpenApiMeta } from 'trpc-openapi';
import { z } from 'zod';
import jwtDecode from 'jwt-decode';
import {
    LCNProfileValidator,
    UnsignedVCValidator,
    VCValidator,
    VPValidator,
} from '@learncard/types';

import { Profile } from '@models';

import { getChallenges } from '@helpers/challenges.helpers';
import {
    connectProfiles,
    getConnectionRequests,
    getConnections,
    getPendingConnections,
    requestConnection,
} from '@helpers/connection.helpers';
import {
    acceptCredential,
    sendCredential,
    storeCredential,
    getCredentialUri,
    getCredentialById,
    getIdFromCredentialUri,
} from '@helpers/credential.helpers';
import { getDidWeb, updateDidForProfile } from '@helpers/did.helpers';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { getCache } from '@helpers/redis.helpers';

import { checkIfProfileExists, searchProfiles } from '@accesslayer/profile/read';

const cache = getCache();

export type DidAuthVP = {
    iss: string;
    vp: {
        '@context': ['https://www.w3.org/2018/credentials/v1'];
        type: ['VerifiablePresentation'];
        holder: string;
    };
    nonce?: string;
};

export type Context = {
    user?: {
        did: string;
        isChallengeValid: boolean;
    };
    domain: string;
};

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const createContext = async ({
    event,
}: CreateAWSLambdaContextOptions<APIGatewayEvent>): Promise<Context> => {
    const authHeader = event.headers.authorization;
    const domainName = event.requestContext.domainName;

    const domain =
        domainName && domainName !== 'offlineContext_domainName' // When running locally, domainName is set to 'offlineContext_domainName'
            ? `${domainName}`
            : 'localhost%3A3000';

    if (authHeader && authHeader.split(' ').length === 2) {
        const [scheme, jwt] = authHeader.split(' ');

        if (scheme === 'Bearer' && jwt) {
            const learnCard = await getEmptyLearnCard();

            const result = await learnCard.invoke.verifyPresentation(jwt, { proofFormat: 'jwt' });

            if (
                result.warnings.length === 0 &&
                result.errors.length === 0 &&
                result.checks.includes('JWS')
            ) {
                const decodedJwt = jwtDecode<DidAuthVP>(jwt);

                const did = decodedJwt.vp.holder;
                const challenge = decodedJwt.nonce;

                if (!challenge) return { user: { did, isChallengeValid: false }, domain };

                const cacheResponse = await cache.get(`${did}|${challenge}`);
                await cache.delete([`${did}|${challenge}`]);

                return { user: { did, isChallengeValid: Boolean(cacheResponse) }, domain };
            }
        }
    }

    return { domain };
};

const openRoute = t.procedure;

const didRoute = openRoute.use(({ ctx, next }) => {
    if (!ctx.user?.did) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});

const didAndChallengeRoute = didRoute.use(({ ctx, next }) => {
    if (!ctx.user?.isChallengeValid) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const appRouter = t.router({
    healthCheck: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/health-check',
                tags: ['Utilities'],
                summary: 'Check health of endpoint',
                description: 'Check if the endpoint is healthy and well',
            },
        })
        .input(z.void())
        .output(z.string())
        .query(async () => {
            return 'Healthy and well!';
        }),

    getChallenges: didRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/challenges',
                tags: ['Utilities'],
                summary: 'Request a list of valid challenges',
                description:
                    'Generates an arbitrary number of valid challenges for a did, then returns them',
            },
        })
        .input(z.object({ amount: z.number().optional() }))
        .output(z.string().array())
        .query(async ({ input, ctx }) => {
            const challenges = getChallenges(input.amount);

            const did = ctx.user.did;

            await Promise.all(
                challenges.map(async challenge => cache.set(`${did}|${challenge}`, 'valid'))
            );

            return challenges;
        }),

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
            const profileExists = await checkIfProfileExists({
                did: ctx.user.did,
                handle: input.handle,
                email: input.email,
            });

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

    sendCredential: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential/send/{handle}',
                tags: ['Credentials'],
                summary: 'Send a Credential',
                description: 'This endpoint sends a credential to a user based on their handle',
            },
        })
        .input(z.object({ handle: z.string(), credential: UnsignedVCValidator.or(VCValidator) }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const did = ctx.user.did;
            const { handle, credential } = input;

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

            return sendCredential(profile, targetProfile, credential, ctx.domain);
        }),

    acceptCredential: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential/accept/{handle}',
                tags: ['Credentials'],
                summary: 'Accept a Credential',
                description: 'This endpoint accepts a credential from a user based on their handle',
            },
        })
        .input(z.object({ handle: z.string(), uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const did = ctx.user.did;
            const { handle, uri } = input;

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

            return acceptCredential(profile, targetProfile, uri);
        }),

    storeCredential: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential/store',
                tags: ['Credentials'],
                summary: 'Store a Credential',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
        })
        .input(z.object({ credential: UnsignedVCValidator.or(VCValidator).or(VPValidator) }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { credential } = input;

            const credentialInstance = await storeCredential(credential);

            return getCredentialUri(credentialInstance.id, ctx.domain);
        }),

    getCredential: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/credential/{uri}',
                tags: ['Credentials'],
                summary: 'Store a Credential',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
        })
        .input(z.object({ uri: z.string() }))
        .output(UnsignedVCValidator.or(VCValidator).or(VPValidator))
        .query(async ({ input }) => {
            const { uri } = input;

            const id = getIdFromCredentialUri(uri);

            const credentialInstance = await getCredentialById(id);

            if (!credentialInstance) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Credential does not exist',
                });
            }

            return JSON.parse(credentialInstance.credential);
        }),
});
export type AppRouter = typeof appRouter;
