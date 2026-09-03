import { initTRPC, TRPCError } from '@trpc/server';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { CreateAWSLambdaContextOptions } from '@trpc/server/adapters/aws-lambda';
import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { OpenApiMeta } from 'trpc-to-openapi';
import jwtDecode from 'jwt-decode';
import * as Sentry from '@sentry/serverless';

import { resolveTenantFromRequest, type ResolvedTenant } from '@learncard/email-templates';

import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { consumeChallengeForDid } from '@cache/challenges';

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
    tenant: ResolvedTenant;
    debug?: boolean;
    clientIp?: string;
    // Value of the X-Auth-Token header — a caller's own provider token
    // (e.g. a Firebase ID token), distinct from the Authorization header
    // (reserved for the DID-Auth VP). Lets GET routes that verify a
    // provider token (e.g. keys.getRecoveryShare, P0-4) read it without
    // putting it in a query string, without colliding with clients that
    // send a DID-Auth VP as Authorization for the same route.
    providerToken?: string;
};

export const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const createContext = async (
    options: CreateAWSLambdaContextOptions<APIGatewayProxyEventV2> | CreateFastifyContextOptions
): Promise<Context> => {
    const event = 'event' in options ? options.event : options.req;
    const authHeader = event.headers.authorization;
    const domainName = 'requestContext' in event ? event.requestContext.domainName : '';
    const debug = process.env.NODE_ENV === 'test';

    // See Context.providerToken — a separate header from Authorization,
    // which is reserved for the DID-Auth VP handled below.
    const providerTokenHeader = (event.headers as Record<string, string | undefined>)[
        'x-auth-token'
    ];
    const providerToken = providerTokenHeader || undefined;

    const domain =
        !domainName || process.env.IS_OFFLINE
            ? `localhost%3A${process.env.PORT || 3000}`
            : domainName;

    // Resolve tenant from request headers (X-Tenant-Id → Origin → env → default)
    const rawHeaders =
        'event' in options
            ? (options.event.headers as Record<string, string | undefined>)
            : (options.req.headers as Record<string, string | string[] | undefined>);

    const tenant = resolveTenantFromRequest(rawHeaders);

    // Extract client IP for rate limiting (available on all return paths)
    let clientIp: string | undefined;

    if ('event' in options) {
        const awsEvent = options.event as APIGatewayProxyEventV2;
        clientIp =
            awsEvent.requestContext?.http?.sourceIp ??
            awsEvent.headers?.['x-forwarded-for']?.split(',')[0]?.trim();
    } else {
        clientIp =
            options.req.ip ??
            options.req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim();
    }

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
                            tenant,
                            debug,
                            clientIp,
                            providerToken,
                        };

                    const cacheResponse = await consumeChallengeForDid(did, challenge);

                    return {
                        user: { did, isChallengeValid: Boolean(cacheResponse), authorizedDid },
                        domain,
                        tenant,
                        debug,
                        clientIp,
                        providerToken,
                    };
                }
            }
        }
    } catch (e) {
        console.error(e);
    }

    return { domain, tenant, clientIp, providerToken };
};

// ---------------------------------------------------------------------------
// P0-4: Secret leakage — telemetry
// ---------------------------------------------------------------------------
//
// /keys/* inputs carry Firebase auth tokens, encrypted/plaintext key shares,
// and recovery artifacts. `attachRpcInput` is disabled below (globally, since
// this middleware chain is shared by every router — see app.ts) so Sentry
// never receives raw tRPC input. The event processor further down is
// defense-in-depth: even if input attachment is ever re-enabled upstream, or
// another integration attaches a raw payload to an event for a /keys/*
// request, this strips anything secret-shaped before it can leave the
// process.
const SECRET_FIELD_RE = /share|token|seed|recoverykey|blob/i;

/**
 * Recursively replaces values whose key matches SECRET_FIELD_RE with
 * '[Redacted]'. Guards against circular references and caps recursion depth.
 * Exported for unit testing.
 */
export const redactSecretFields = (
    value: unknown,
    depth = 0,
    seen: Set<object> = new Set()
): unknown => {
    if (depth > 10 || value === null || value === undefined) return value;

    if (Array.isArray(value)) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        return value.map(item => redactSecretFields(item, depth + 1, seen));
    }

    if (typeof value === 'object') {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, val]) => [
                key,
                SECRET_FIELD_RE.test(key) ? '[Redacted]' : redactSecretFields(val, depth + 1, seen),
            ])
        );
    }

    return value;
};

export const openRoute = t.procedure
    .use(t.middleware(Sentry.Handlers.trpcMiddleware({ attachRpcInput: false }) as any))
    .use(({ ctx, next, path }) => {
        Sentry.configureScope(scope => {
            scope.setTransactionName(`trpc-${path}`);

            if (path.startsWith('keys.')) {
                scope.addEventProcessor(event => {
                    if (event.contexts) {
                        event.contexts = redactSecretFields(
                            event.contexts
                        ) as typeof event.contexts;
                    }
                    if (event.extra) {
                        event.extra = redactSecretFields(event.extra) as typeof event.extra;
                    }
                    if (event.request?.data) {
                        event.request.data = redactSecretFields(event.request.data);
                    }
                    return event;
                });
            }
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
