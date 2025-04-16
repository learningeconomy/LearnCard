import { initTRPC, TRPCError } from '@trpc/server';
import { APIGatewayEvent, CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { OpenApiMeta } from 'trpc-openapi';
import jwtDecode from 'jwt-decode';
import * as Sentry from '@sentry/serverless';
import { AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX } from '@learncard/types';

import { RegExpTransformer } from '@learncard/helpers';

import { getProfileByDid } from '@accesslayer/profile/read';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { invalidateChallengeForDid, isChallengeValidForDid } from '@cache/challenges';
import { ProfileType } from 'types/profile';
import { getProfileManagerById } from '@accesslayer/profile-manager/read';
import { isAuthGrantChallengeValidForDID } from '@accesslayer/auth-grant/read';
import { AUTH_GRANT_FULL_ACCESS_SCOPE, AUTH_GRANT_NO_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { userHasRequiredScopes } from '@helpers/auth-grant.helpers';

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
        scope?: string;
    };
    domain: string;
};

export type RequiredScope = { requiredScope?: string };

export type RouteMetadata = OpenApiMeta & RequiredScope;

export const t = initTRPC
    .context<Context>()
    .meta<RouteMetadata>()
    .create({
        transformer: {
            input: RegExpTransformer,
            output: { serialize: o => o, deserialize: o => o },
        },
    });

export const createContext = async (
    options: CreateAWSLambdaContextOptions<APIGatewayEvent> | CreateFastifyContextOptions
): Promise<Context> => {
    const event = 'event' in options ? options.event : options.req;
    const authHeader = event.headers.authorization;
    const domainName = 'requestContext' in event ? event.requestContext.domainName : '';

    const _domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName.replace(/:/g, '%3A');

    const domain = process.env.DOMAIN_NAME || _domain;

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

                if (!challenge)
                    return {
                        user: { did, isChallengeValid: false, scope: AUTH_GRANT_NO_ACCESS_SCOPE },
                        domain,
                    };

                let isChallengeValid = false;
                let scope = AUTH_GRANT_FULL_ACCESS_SCOPE;
                if (challenge?.includes(AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX)) {
                    const { isChallengeValid: _isChallengeValid, scope: _scope } =
                        await isAuthGrantChallengeValidForDID(challenge, did);

                    isChallengeValid = _isChallengeValid;
                    scope = _scope;
                } else {
                    const cacheResponse = await isChallengeValidForDid(did, challenge);
                    await invalidateChallengeForDid(did, challenge);
                    isChallengeValid = Boolean(cacheResponse);
                    scope = AUTH_GRANT_FULL_ACCESS_SCOPE;
                }

                Sentry.setUser({ id: did });

                return { user: { did, isChallengeValid, scope }, domain };
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
    if (!ctx.user?.did) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const didParts = ctx.user.did.split(':');

    let did = ctx.user.did;

    // User authenticated with their did:web. Resolve it and use their controller did to find their
    // profile
    if (didParts[1] === 'web' && didParts[2] === ctx.domain) {
        if (didParts[3] === 'manager') {
            return next({
                ctx: { ...ctx, user: { ...ctx.user, profile: null as ProfileType | null } },
            });
        }

        const learnCard = await getEmptyLearnCard();

        const didDoc = await learnCard.invoke.resolveDid(
            did,
            process.env.IS_OFFLINE ? { noCache: true } : undefined
        );

        if (!didDoc.controller) {
            return next({
                ctx: { ...ctx, user: { ...ctx.user, profile: null as ProfileType | null } },
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

export const scopedRoute = didAndChallengeRoute.use(({ ctx, next, meta }) => {
    if (!meta?.requiredScope) {
        return next({ ctx });
    }

    const userScope = ctx.user?.scope || AUTH_GRANT_NO_ACCESS_SCOPE;

    const hasRequiredScope = userHasRequiredScopes(userScope, meta.requiredScope);

    if (!hasRequiredScope) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: `This operation requires ${meta.requiredScope} scope`,
        });
    }

    return next({ ctx });
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

export const profileRoute = didAndChallengeRoute.use(async ({ ctx, next, meta }) => {
    const { profile } = ctx.user;

    if (!profile) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile not found. Please make a profile!',
        });
    }

    if (!meta?.requiredScope) {
        return next({ ctx });
    }

    const userScope = ctx.user?.scope || AUTH_GRANT_NO_ACCESS_SCOPE;

    const hasRequiredScope = userHasRequiredScopes(userScope, meta.requiredScope);

    if (!hasRequiredScope) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: `This operation requires ${meta.requiredScope} scope`,
        });
    }

    return next({ ctx });
});

export const openProfileManagerRoute = openRoute.use(async ({ ctx, next }) => {
    if (!ctx.user?.did) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const didParts = ctx.user.did.split(':');

    if (
        didParts.length !== 5 ||
        didParts[1] !== 'web' ||
        didParts[2] !== ctx.domain ||
        didParts[3] !== 'manager'
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Please make this request using a Profile Manager did',
        });
    }

    const id = didParts[4];

    if (!id) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Could not get manager id' });

    const manager = await getProfileManagerById(id);

    if (manager) Sentry.setUser({ id: manager.id, username: manager.displayName });

    return next({ ctx: { ...ctx, user: { ...ctx.user, manager } } });
});

export const profileManagerRoute = openProfileManagerRoute.use(async ({ ctx, next }) => {
    const { manager } = ctx.user;

    if (!manager) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Profile Manager not found. Please make a profile manager!',
        });
    }

    return next({ ctx: { ...ctx, user: { ...ctx.user, manager } } });
});
