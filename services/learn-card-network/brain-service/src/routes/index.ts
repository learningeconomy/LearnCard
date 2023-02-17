import { initTRPC, TRPCError } from '@trpc/server';
import { APIGatewayEvent, CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import { OpenApiMeta } from 'trpc-openapi';
import jwtDecode from 'jwt-decode';

import { getProfileByDid } from '@accesslayer/profile/read';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { getCache } from '@cache';

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

export const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const createContext = async ({
    event,
}: CreateAWSLambdaContextOptions<APIGatewayEvent>): Promise<Context> => {
    const authHeader = event.headers.authorization;
    const domainName = event.requestContext.domainName;

    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName;

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

export const openRoute = t.procedure;

export const didRoute = openRoute.use(({ ctx, next }) => {
    if (!ctx.user?.did) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const didAndChallengeRoute = didRoute.use(({ ctx, next }) => {
    if (!ctx.user?.isChallengeValid) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const openProfileRoute = didRoute.use(async ({ ctx, next }) => {
    const profile = await getProfileByDid(ctx.user.did);

    if (!profile) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found. Please make a profile!',
        });
    }

    return next({ ctx: { ...ctx, user: { ...ctx.user, profile } } });
});

export const profileRoute = didAndChallengeRoute.use(async ({ ctx, next }) => {
    const profile = await getProfileByDid(ctx.user.did);

    if (!profile) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found. Please make a profile!',
        });
    }

    return next({ ctx: { ...ctx, user: { ...ctx.user, profile } } });
});
