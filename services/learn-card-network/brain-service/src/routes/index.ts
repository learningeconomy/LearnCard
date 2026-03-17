import http from 'node:http';

import { initTRPC, TRPCError } from '@trpc/server';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import { NodeHTTPCreateContextFnOptions } from '@trpc/server/adapters/node-http';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { OpenApiMeta } from 'trpc-to-openapi';
import jwtDecode from 'jwt-decode';
import * as Sentry from '@sentry/serverless';
import { AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX } from '@learncard/types';
import { ContactMethodType } from '@learncard/types';

import { RegExpTransformer } from '@learncard/helpers';

import { getProfileByDid } from '@accesslayer/profile/read';
import {
    isProfileManaged,
    getProfilesThatManageAProfile,
} from '@accesslayer/profile/relationships/read';
import { getDidWeb } from '@helpers/did.helpers';
import { getEmptyLearnCard, isServersDidWebDID } from '@helpers/learnCard.helpers';
import { invalidateChallengeForDid, isChallengeValidForDid } from '@cache/challenges';
import { ProfileType } from 'types/profile';
import { getProfileManagerById } from '@accesslayer/profile-manager/read';
import { isAuthGrantChallengeValidForDID } from '@accesslayer/auth-grant/read';
import { AUTH_GRANT_FULL_ACCESS_SCOPE, AUTH_GRANT_NO_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { userHasRequiredScopes } from '@helpers/auth-grant.helpers';
import { getContactMethodById } from '@accesslayer/contact-method/read';
import { VC } from '@learncard/types';
import { CONTACT_METHOD_SESSION_PREFIX } from '@helpers/contact-method.helpers';

export type DidAuthVP = {
    iss: string;
    vp: {
        '@context': string[];
        type: string[];
        holder: string;
        verifiableCredential?: VC[];
    };
    nonce?: string;
};

export type Context = {
    user?: {
        did: string;
        isChallengeValid: boolean;
        scope?: string;
    };
    contactMethod?: ContactMethodType;
    domain: string;
    _guardianApprovalToken?: string;
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
    options:
        | CreateAWSLambdaContextOptions<APIGatewayProxyEventV2>
        | CreateFastifyContextOptions
        | NodeHTTPCreateContextFnOptions<http.IncomingMessage, http.ServerResponse>
        | { req: { headers: Map<string, string> } }
): Promise<Context> => {
    const event = 'event' in options ? options.event : options.req;
    const authHeader =
        'get' in event.headers
            ? (event.headers as Map<string, string>).get('authorization')
            : event.headers.authorization;
    const _guardianApprovalToken =
        'get' in event.headers
            ? (event.headers as Map<string, string>).get('x-guardian-approval')
            : (event.headers as Record<string, string | undefined>)['x-guardian-approval'];
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

                // If the user is using a provisional auth token for a contact method:
                if (challenge?.includes(CONTACT_METHOD_SESSION_PREFIX)) {
                    if (isServersDidWebDID(did)) {
                        const contactMethodId = challenge.split(':')[1];
                        if (!contactMethodId) throw new TRPCError({ code: 'NOT_FOUND' });

                        const contactMethod = await getContactMethodById(contactMethodId);
                        if (!contactMethod) throw new TRPCError({ code: 'NOT_FOUND' });
                        return {
                            contactMethod,
                            domain,
                        };
                    }
                    // If the user is using a real auth grant i.e. an API Token.
                } else if (challenge?.includes(AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX)) {
                    const { isChallengeValid: _isChallengeValid, scope: _scope } =
                        await isAuthGrantChallengeValidForDID(challenge, did);

                    isChallengeValid = _isChallengeValid;
                    scope = _scope;
                    // If the user is using a real challenge signed by their private key.
                } else {
                    const cacheResponse = await isChallengeValidForDid(did, challenge);
                    await invalidateChallengeForDid(did, challenge);
                    isChallengeValid = Boolean(cacheResponse);
                    scope = AUTH_GRANT_FULL_ACCESS_SCOPE;
                }

                Sentry.setUser({ id: did });

                return { user: { did, isChallengeValid, scope }, domain, _guardianApprovalToken };
            }
        }
    }

    return { domain, _guardianApprovalToken };
};

export const openRoute = t.procedure
    .use(t.middleware(Sentry.Handlers.trpcMiddleware({ attachRpcInput: true }) as any))
    .use(({ ctx, next, path }) => {
        Sentry.configureScope(scope => {
            scope.setTransactionName(`trpc-${path}`);
        });
        return next({ ctx });
    });

export const resolveProfileFromContextDid = async (
    didFromContext: string | undefined,
    domain: string
): Promise<ProfileType | null> => {
    if (!didFromContext) return null;

    const didParts = didFromContext.split(':');
    let did = didFromContext;

    // User authenticated with their did:web. Resolve it and use their controller did to find profile.
    if (didParts[1] === 'web' && didParts[2] === domain) {
        if (didParts[3] === 'manager') return null;

        const learnCard = await getEmptyLearnCard();
        const didDoc = await learnCard.invoke.resolveDid(
            did,
            process.env.IS_OFFLINE ? { noCache: true } : undefined
        );

        if (!didDoc.controller) return null;

        const controller = Array.isArray(didDoc.controller)
            ? didDoc.controller.at(0)
            : didDoc.controller;

        if (!controller) return null;

        did = controller;
    }

    return getProfileByDid(did);
};

export const didRoute = openRoute.use(async ({ ctx, next }) => {
    if (!ctx.user?.did) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const profile = await resolveProfileFromContextDid(ctx.user.did, ctx.domain);

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
            code: 'UNAUTHORIZED',
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
        return next({ ctx: { ...ctx, user: { ...ctx.user, profile } } });
    }

    const userScope = ctx.user?.scope || AUTH_GRANT_NO_ACCESS_SCOPE;

    const hasRequiredScope = userHasRequiredScopes(userScope, meta.requiredScope);

    if (!hasRequiredScope) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: `This operation requires ${meta.requiredScope} scope`,
        });
    }

    return next({ ctx: { ...ctx, user: { ...ctx.user, profile } } });
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

export const verifiedContactRoute = openRoute.use(async ({ ctx, next }) => {
    if (!ctx.contactMethod) throw new TRPCError({ code: 'UNAUTHORIZED' });

    return next({ ctx: { ...ctx, contactMethod: ctx.contactMethod } });
});

export type GuardianApprovalToken = {
    iss: string;
    sub: string;
    iat: number;
    exp: number;
    scope: string;
};

export const guardianGatedRoute = profileRoute.use(async ({ ctx, next }) => {
    const { profile } = ctx.user;
    const guardianApprovalToken = ctx._guardianApprovalToken;

    const isChildAccount = await isProfileManaged(profile.profileId);

    if (!isChildAccount) {
        return next({
            ctx: { ...ctx, isChildAccount: false, hasGuardianApproval: false },
        });
    }

    if (!guardianApprovalToken) {
        return next({
            ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: false },
        });
    }

    try {
        const learnCard = await getEmptyLearnCard();

        const result = await learnCard.invoke.verifyPresentation(guardianApprovalToken, {
            proofFormat: 'jwt',
        });

        if (result.errors.length > 0 || !result.checks.includes('JWS')) {
            return next({
                ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: false },
            });
        }

        const jwtPayload = jwtDecode<{ vp?: { proof?: { challenge?: string } }; nonce?: string }>(
            guardianApprovalToken
        );

        const challengeStr = jwtPayload.vp?.proof?.challenge ?? jwtPayload.nonce;
        if (!challengeStr) {
            return next({
                ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: false },
            });
        }

        let guardianClaims: GuardianApprovalToken;
        try {
            guardianClaims = JSON.parse(challengeStr);
        } catch {
            return next({
                ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: false },
            });
        }

        if (!guardianClaims.exp || guardianClaims.exp * 1000 < Date.now()) {
            return next({
                ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: false },
            });
        }

        if (guardianClaims.scope !== 'guardian-approval') {
            return next({
                ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: false },
            });
        }

        const childDidWeb = getDidWeb(ctx.domain, profile.profileId);
        if (guardianClaims.sub !== childDidWeb) {
            return next({
                ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: false },
            });
        }

        const managers = await getProfilesThatManageAProfile(profile.profileId);
        const guardianProfile = managers.find(manager => {
            const managerDidWeb = getDidWeb(ctx.domain, manager.profileId);
            return guardianClaims.iss === managerDidWeb || guardianClaims.iss === manager.did;
        });

        if (!guardianProfile) {
            return next({
                ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: false },
            });
        }

        return next({
            ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: true },
        });
    } catch {
        return next({
            ctx: { ...ctx, isChildAccount: true, hasGuardianApproval: false },
        });
    }
});
