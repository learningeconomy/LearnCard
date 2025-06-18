import { initTRPC, TRPCError } from '@trpc/server';
import type { APIGatewayEvent, CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { OpenApiMeta } from 'trpc-openapi';
import jwtDecode from 'jwt-decode';
import * as Sentry from '@sentry/serverless';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { invalidateChallengeForDid, isChallengeValidForDid } from '@cache/challenges';

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
        authorizedDid?: boolean;
    };
    domain: string;
    debug?: boolean;
};

export const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const createContext = async (
    options: CreateAWSLambdaContextOptions<APIGatewayEvent> | CreateFastifyContextOptions
): Promise<Context> => {
    const event = 'event' in options ? options.event : options.req;
    const authHeader = event.headers.authorization;
    const domainName = 'requestContext' in event ? event.requestContext.domainName : '';
    const debug = process.env.NODE_ENV === 'test';

    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName;

    try {
        if (authHeader && authHeader.split(' ').length === 2) {
            const [scheme, jwt] = authHeader.split(' ');

            if (scheme === 'Bearer' && jwt) {
                const learnCard = await getEmptyLearnCard();

                const result = await learnCard.invoke.verifyPresentation(jwt, {
                    proofFormat: 'jwt',
                });
                if (
                    result.warnings.length === 0 &&
                    result.errors.length === 0 &&
                    result.checks.includes('JWS')
                ) {
                    const decodedJwt = jwtDecode<DidAuthVP>(jwt);

                    const did = decodedJwt.vp.holder;
                    const challenge = decodedJwt.nonce;

                    Sentry.setUser({ id: did });

                    const authorizedDids = process.env.AUTHORIZED_DIDS?.split(' ') ?? [
                        'did:web:network.learncard.com',
                    ];
                    const authorizedDid = authorizedDids?.includes(did);

                    if (!challenge)
                        return {
                            user: { did, isChallengeValid: false, authorizedDid },
                            domain,
                            debug,
                        };

                    const cacheResponse = await isChallengeValidForDid(did, challenge);
                    await invalidateChallengeForDid(did, challenge);

                    return {
                        user: { did, isChallengeValid: Boolean(cacheResponse), authorizedDid },
                        domain,
                        debug,
                    };
                }
            }
        }
    } catch (error) {
        console.error(error);
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

export const didRoute = openRoute.use(({ ctx, next }) => {
    if (!ctx.user?.did) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const authorizedDidRoute = didRoute.use(({ ctx, next }) => {
    if (!ctx.user?.authorizedDid) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const didAndChallengeRoute = didRoute.use(({ ctx, next }) => {
    if (!ctx.user?.isChallengeValid) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});
