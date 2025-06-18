import type http from 'node:http';

import { initTRPC, TRPCError } from '@trpc/server';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import type { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { OpenApiMeta } from 'trpc-to-openapi';
import jwtDecode from 'jwt-decode';
import * as Sentry from '@sentry/serverless';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { invalidateChallengeForDid, isChallengeValidForDid } from '@cache/challenges';
import type { DidAuthVP } from 'types/vp';

export type Context = {
    user?: {
        did: string;
        isChallengeValid: boolean;
    };
    domain: string;
};

export const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const createContext = async (
    options:
        | CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>
        | CreateFastifyContextOptions
        | NodeHTTPCreateContextFnOptions<http.IncomingMessage, http.ServerResponse>
): Promise<Context> => {
    const event = 'event' in options ? options.event : options.req;
    const authHeader = event.headers.authorization;
    const domainName = 'requestContext' in event ? event.requestContext.domainName : '';

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

                const did = decodedJwt.vp.holder!;
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
    .use(t.middleware(Sentry.Handlers.trpcMiddleware({ attachRpcInput: true }) as any))
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

export const didAndChallengeRoute = didRoute.use(({ ctx, next }) => {
    if (!ctx.user?.isChallengeValid) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});
