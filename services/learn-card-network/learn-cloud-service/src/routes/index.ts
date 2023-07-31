import { initTRPC, TRPCError } from '@trpc/server';
import { APIGatewayEvent, CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import { OpenApiMeta } from 'trpc-openapi';
import jwtDecode from 'jwt-decode';
import * as Sentry from '@sentry/serverless';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { invalidateChallengeForDid, isChallengeValidForDid } from '@cache/challenges';
import { DidAuthVP } from 'types/vp';

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

export const didRoute = openRoute.use(({ ctx, next }) => {
    if (!ctx.user?.did) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});

export const didAndChallengeRoute = didRoute.use(({ ctx, next }) => {
    if (!ctx.user?.isChallengeValid) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, user: ctx.user } });
});
