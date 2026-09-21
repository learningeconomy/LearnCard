import { environment } from '@environment';
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
import { MAX_SHARE_LINK_REQUEST_BYTES, utf8ByteLength } from '@learncard/types';

import { RegExpTransformer } from '@learncard/helpers';
import { resolveTenantFromRequest, type ResolvedTenant } from '@learncard/email-templates';

import { getProfileByDid, getProfileByProfileId } from '@accesslayer/profile/read';
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
    tenant: ResolvedTenant;
    _guardianApprovalToken?: string;
    /**
     * Caller IP, when the transport exposes one. Used to scope abuse limits on
     * pre-auth routes, where there is no DID to key a limit on. Best-effort:
     * absent for transports without a request context (e.g. direct in-process
     * callers), so treat `undefined` as "unknown caller", not "trusted".
     */
    sourceIp?: string;
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
        !domainName || environment.IS_OFFLINE
            ? `localhost%3A${environment.PORT || 3000}`
            : domainName.replace(/:/g, '%3A');

    const domain = environment.DOMAIN_NAME || _domain;

    // API Gateway v2 puts the caller IP on requestContext.http.sourceIp. Other
    // transports (Fastify/NodeHTTP/in-process) may not carry one at all.
    const sourceIp =
        'requestContext' in event
            ? (event.requestContext as { http?: { sourceIp?: string } }).http?.sourceIp
            : undefined;

    // Resolve tenant from request headers (X-Tenant-Id → Origin → env → default)
    const rawHeaders =
        'event' in options
            ? (options.event.headers as Record<string, string | undefined>)
            : 'get' in event.headers
              ? Object.fromEntries(event.headers as Map<string, string>)
              : (event.headers as Record<string, string | string[] | undefined>);

    const tenant = resolveTenantFromRequest(
        rawHeaders as Record<string, string | string[] | undefined>
    );

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
                        tenant,
                        sourceIp,
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
                            tenant,
                            sourceIp,
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

                return {
                    user: { did, isChallengeValid, scope },
                    domain,
                    tenant,
                    _guardianApprovalToken,
                    sourceIp,
                };
            }
        }
    }

    return { domain, tenant, _guardianApprovalToken, sourceIp };
};

const sentryTransactionNameMiddleware = t.middleware(({ ctx, next, path }) => {
    Sentry.configureScope(scope => {
        scope.setTransactionName(`trpc-${path}`);
    });
    return next({ ctx });
});

// Sentry's tRPC middleware type predates this repo's generic context. Cast
// through the tRPC builder's expected parameter type instead of `any`.
type SentryTrpcMiddleware = Parameters<typeof t.middleware>[0];

const sentryInputCaptureMiddleware = Sentry.Handlers.trpcMiddleware({
    attachRpcInput: true,
}) as unknown as SentryTrpcMiddleware;

const sentryNoInputCaptureMiddleware = Sentry.Handlers.trpcMiddleware({
    attachRpcInput: false,
}) as unknown as SentryTrpcMiddleware;

/**
 * Complete-request byte bound for owner share-link routes, enforced on the RAW
 * input before Zod parsing/stripping. Individual field validators cannot bound a
 * request whose unknown or duplicate fields are stripped first, so this measures
 * the whole serialized body (UTF-8) and fails closed over the shared 1 MiB cap.
 *
 * It is composed into the base so it runs before authentication and before any
 * input parser, and can never be skipped by a malformed or unauthenticated call.
 */
const enforceShareLinkRequestByteBound = t.middleware(async ({ ctx, next, getRawInput }) => {
    const raw = await getRawInput();

    let bytes: number;
    if (raw === undefined || raw === null) {
        bytes = 0;
    } else if (typeof raw === 'string') {
        bytes = utf8ByteLength(raw);
    } else {
        let serialized: string;
        try {
            serialized = JSON.stringify(raw);
        } catch {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'invalid share-link request' });
        }
        bytes = utf8ByteLength(serialized);
    }

    if (bytes > MAX_SHARE_LINK_REQUEST_BYTES) {
        throw new TRPCError({
            code: 'PAYLOAD_TOO_LARGE',
            message: 'share-link request exceeds the 1 MiB limit',
        });
    }

    return next({ ctx });
});

export const openRoute = t.procedure
    .use(t.middleware(sentryInputCaptureMiddleware))
    .use(sentryTransactionNameMiddleware);

/**
 * LC-2187 public share-link paths must never be cached by an intermediary or a
 * browser. tRPC has no per-procedure header API, so the actual HTTP adapters
 * (Fastify and Lambda, both tRPC and OpenAPI) apply `Cache-Control` from the
 * resolved procedure path through this single helper.
 */
export const PUBLIC_SHARE_LINK_ROUTE_PREFIX = 'publicShareLinks.';

export const publicShareLinkCacheControlHeaders = (
    paths: readonly string[] | undefined
): Record<string, string> =>
    (paths ?? []).some(path => path.startsWith(PUBLIC_SHARE_LINK_ROUTE_PREFIX))
        ? { 'Cache-Control': 'private, no-store' }
        : {};

/**
 * Route base for procedures whose input carries owner-private material (titles,
 * notes, ciphertext envelopes, recovery JWEs) and whose error paths must not
 * attach raw request bodies to Sentry. It runs the same Sentry error/transaction
 * handling but with input attachment disabled, so no branch — malformed,
 * unauthenticated or failing — can capture the payload, and it enforces the
 * complete-request byte bound before input parsing.
 */
export const openRouteWithoutInputCapture = t.procedure
    .use(t.middleware(sentryNoInputCaptureMiddleware))
    .use(sentryTransactionNameMiddleware)
    .use(enforceShareLinkRequestByteBound);

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

        // For managed profiles (did:web:domain:users:profileId), try direct profileId lookup first.
        // Managed DID docs have a `controller` pointing to the parent, so following controller
        // would incorrectly resolve to the parent's profile instead of the managed one.
        if (didParts[3] === 'users' && didParts[4]) {
            const directProfile = await getProfileByProfileId(didParts[4]);
            if (directProfile) return directProfile;
        }

        const learnCard = await getEmptyLearnCard();
        const didDoc = await learnCard.invoke.resolveDid(
            did,
            environment.IS_OFFLINE ? { noCache: true } : undefined
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

/**
 * Owner share-link routes: identical auth, challenge, profile and scope
 * enforcement to {@link profileRoute}, but composed on the base that disables
 * Sentry RPC input attachment because the payload contains owner-private
 * material (title, note, ciphertext envelope, recovery JWE).
 *
 * The handlers are intentionally inlined rather than extracted into standalone
 * `t.middleware` values so tRPC's context-narrowing (the added `profile` field)
 * flows to each resolver exactly as it does for `profileRoute`.
 */
export const didRouteWithoutInputCapture = openRouteWithoutInputCapture.use(
    async ({ ctx, next }) => {
        if (!ctx.user?.did) {
            throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

        const profile = await resolveProfileFromContextDid(ctx.user.did, ctx.domain);

        if (profile) Sentry.setUser({ id: profile.profileId, username: profile.displayName });

        return next({ ctx: { ...ctx, user: { ...ctx.user, profile } } });
    }
);

export const didAndChallengeRouteWithoutInputCapture = didRouteWithoutInputCapture.use(
    ({ ctx, next }) => {
        if (!ctx.user?.isChallengeValid) throw new TRPCError({ code: 'UNAUTHORIZED' });

        return next({ ctx: { ...ctx, user: ctx.user } });
    }
);

export const profileRouteWithoutInputCapture = didAndChallengeRouteWithoutInputCapture.use(
    async ({ ctx, next, meta }) => {
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
    }
);

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
    iat?: number;
    exp: number;
    scope: string;
};

// Match the existing guardian UI's five-minute approval window.
const GUARDIAN_APPROVAL_MAX_TTL_SECONDS = 5 * 60;
const GUARDIAN_APPROVAL_CLOCK_SKEW_SECONDS = 60;

export const guardianGatedRoute = profileRoute.use(async ({ ctx, next }) => {
    const { profile } = ctx.user;
    const guardianApprovalToken = ctx._guardianApprovalToken;
    const isChildAccount = await isProfileManaged(profile.profileId);
    let guardianIdentity: { profileId: string; did: string } | undefined;

    if (isChildAccount && guardianApprovalToken) {
        try {
            const learnCard = await getEmptyLearnCard();
            const result = await learnCard.invoke.verifyPresentation(guardianApprovalToken, {
                proofFormat: 'jwt',
            });

            // Verifier warnings are advisory; errors and a missing JWS check are fatal.
            // Identity and current manager authorization are checked independently below.
            if (result.errors.length === 0 && result.checks.includes('JWS')) {
                const jwtHeader = jwtDecode<{ kid?: string }>(guardianApprovalToken, {
                    header: true,
                });
                const jwtPayload = jwtDecode<{
                    iss?: string;
                    vp?: { holder?: string; proof?: { challenge?: string } };
                    nonce?: string;
                }>(guardianApprovalToken);
                const challenge = jwtPayload.vp?.proof?.challenge ?? jwtPayload.nonce;
                const claims: GuardianApprovalToken | null =
                    typeof challenge === 'string' ? JSON.parse(challenge) : null;
                const now = Date.now() / 1000;
                const signerDid =
                    typeof jwtHeader.kid === 'string' ? jwtHeader.kid.split('#')[0] : undefined;

                // Verification proves the key's signature; bind every identity claim to that key.
                // Older clients omit iat. Allow clock skew without extending the signed lifetime
                // or accepting a token whose actual expiry has passed.
                if (
                    claims &&
                    signerDid &&
                    jwtPayload.iss === signerDid &&
                    jwtPayload.vp?.holder === signerDid &&
                    claims.iss === signerDid &&
                    typeof claims.exp === 'number' &&
                    Number.isFinite(claims.exp) &&
                    claims.exp > now &&
                    claims.exp <=
                        now +
                            GUARDIAN_APPROVAL_MAX_TTL_SECONDS +
                            GUARDIAN_APPROVAL_CLOCK_SKEW_SECONDS &&
                    (claims.iat === undefined ||
                        (typeof claims.iat === 'number' &&
                            Number.isFinite(claims.iat) &&
                            claims.iat <= now + GUARDIAN_APPROVAL_CLOCK_SKEW_SECONDS &&
                            claims.exp > claims.iat &&
                            claims.exp - claims.iat <= GUARDIAN_APPROVAL_MAX_TTL_SECONDS)) &&
                    claims.scope === 'guardian-approval' &&
                    claims.sub === getDidWeb(ctx.domain, profile.profileId)
                ) {
                    const managers = await getProfilesThatManageAProfile(profile.profileId);
                    const guardian = managers.find(
                        manager =>
                            signerDid === manager.did ||
                            signerDid === getDidWeb(ctx.domain, manager.profileId)
                    );
                    if (guardian) {
                        guardianIdentity = { profileId: guardian.profileId, did: signerDid };
                    } else {
                        console.warn('guardian_approval: unauthorized_manager');
                    }
                } else {
                    console.warn('guardian_approval: invalid_claims');
                }
            } else {
                console.warn('guardian_approval: verification_failed');
            }
        } catch {
            // Malformed or unverifiable presentations never authorize a guardian-only mutation.
            console.warn('guardian_approval: malformed_or_unverifiable');
        }
    }

    return next({
        ctx: {
            ...ctx,
            isChildAccount,
            hasGuardianApproval: guardianIdentity !== undefined,
            guardianIdentity,
        },
    });
});
