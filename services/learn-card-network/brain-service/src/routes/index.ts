import { initTRPC, TRPCError } from '@trpc/server';
import { APIGatewayEvent, CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { OpenApiMeta } from 'trpc-openapi';
import jwtDecode from 'jwt-decode';
import * as Sentry from '@sentry/serverless';

import { getProfileByDid } from '@accesslayer/profile/read';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { invalidateChallengeForDid, isChallengeValidForDid } from '@cache/challenges';
import { ProfileInstance } from '@models';

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

export const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const createContext = async (
    options: CreateAWSLambdaContextOptions<APIGatewayEvent> | CreateFastifyContextOptions
): Promise<Context> => {
    const event = 'event' in options ? options.event : options.req;
    const authHeader = event.headers.authorization;
    const domainName = 'requestContext' in event ? event.requestContext.domainName : '';

    const _domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName;

    const domain = process.env.CUSTOM_DOMAIN || _domain;

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

                const cacheResponse = await isChallengeValidForDid(did, challenge);
                await invalidateChallengeForDid(did, challenge);

                Sentry.setUser({ id: did });

                return { user: { did, isChallengeValid: Boolean(cacheResponse) }, domain };
            }
        }
    }

    return { domain };
};

export const openRoute = t.procedure
    .use(t.middleware(Sentry.Handlers.trpcMiddleware({ attachRpcInput: true })))
    .use(({ ctx, next, path }) => {
        Sentry.configureScope(scope => {
            scope.setTransactionName(`trpc-${path}`);
        });
        return next({ ctx });
    });

export const didRoute = openRoute.use(async ({ ctx, next }) => {
    if (!ctx.user?.did) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const didParts = ctx.user.did.split(':');

    let did = ctx.user.did;

    // User authenticated with their did:web. Resolve it and use their controller did to find their
    // profile
    if (didParts[1] === 'web' && didParts[2] === ctx.domain) {
        const learnCard = await getEmptyLearnCard();

        const didDoc = await learnCard.invoke.resolveDid(did);

        if (!didDoc.controller) {
            return next({
                ctx: { ...ctx, user: { ...ctx.user, profile: null as ProfileInstance | null } },
            });
        }

        did = Array.isArray(didDoc.controller) ? didDoc.controller[0] : didDoc.controller;
    }

    const profile = await getProfileByDid(did);

    if (profile) Sentry.setUser({ id: profile.profileId, username: profile.displayName });

    return next({ ctx: { ...ctx, user: { ...ctx.user, profile } } });
});

export const didAndChallengeRoute = didRoute.use(({ ctx, next }) => {
    if (!ctx.user?.isChallengeValid) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const openProfileRoute = didRoute.use(async ({ ctx, next }) => {
    const { profile } = ctx.user;

    if (!profile) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found. Please make a profile!',
        });
    }

    return next({ ctx: { ...ctx, user: { ...ctx.user, profile } } });
});

export const profileRoute = didAndChallengeRoute.use(async ({ ctx, next }) => {
    const { profile } = ctx.user;

    if (!profile) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found. Please make a profile!',
        });
    }

    return next({ ctx: { ...ctx, user: { ...ctx.user, profile } } });
});
