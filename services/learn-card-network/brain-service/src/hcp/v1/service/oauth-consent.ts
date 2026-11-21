/**
 * LearnCard addition: DID-authenticated consent for the HCP OAuth AS (`../../oauth`).
 *
 * The AS never sees who the person is. It hands the browser to the LearnCard app with
 * a signed *request ticket*; the signed-in person allows it there, the brain issues a
 * grant to the OAuth client, and returns a signed *consent assertion* naming the
 * grant and the authenticated subject. The AS completes the authorization only from
 * that assertion. Both are HS256 JWTs under HCP_OAUTH_TOKEN_SECRET, the secret the AS
 * signs access tokens with; `typ` and `aud` keep the three token kinds apart.
 *
 * This lives in v1 (not `oauth/`) because the v1 router signs the assertion, and a
 * version folder must not import its siblings; `oauth/` imports it from here.
 */
import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

import { requireSubject } from '../auth';
import { accessForScopes, parseScopeString, scopesForAccess } from '../scopes';
import { urn, type HcpV1Caller, type HcpV1Deps } from './deps';
import { malformed } from './errors';
import { asItStands, createGrant } from './grants';

const encoder = new TextEncoder();
const key = (secret: string) => encoder.encode(secret);
const trimSlash = (url: string) => url.replace(/\/$/, '');

export const OAUTH_REQUEST_TYP = 'hcp-oauth-request';
export const CONSENT_ASSERTION_TYP = 'hcp-consent';
/** The request ticket's audience: the brain's consent route, wherever it runs. */
export const OAUTH_REQUEST_AUDIENCE = 'urn:learncard:hcp:oauth-consent';
export const OAUTH_REQUEST_TTL_SECONDS = 10 * 60;
export const CONSENT_ASSERTION_TTL_SECONDS = 120;

/**
 * The purpose an OAuth-issued grant reads under. OAuth scopes carry no purpose, so
 * the grant names this one, the same default a direct consent link uses.
 */
export const OAUTH_GRANT_PURPOSE_CODE = 'https://learncard.com/hcp/purposes/app-access';
/** Same default a direct consent link uses (`duration=1h`). */
export const OAUTH_GRANT_DURATION_MS = 60 * 60 * 1000;

/** The AS and the brain share these: the AS base URL and the HS256 secret. */
export type OAuthConsentConfig = { issuerUrl: string; secret: string };

export type OAuthRequestTicket = {
    requestId: string;
    clientId: string;
    clientName: string;
    clientDid: string;
    /** Space-separated, what the AS will grant (never empty). */
    scope: string;
};

export type ConsentAssertion = { requestId: string; grantId: string; subjectDid: string };

export type VerifyResult<T> = { ok: true; claims: T } | { ok: false; error: string };

const str = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

export const signOAuthRequestTicket = async (
    config: OAuthConsentConfig,
    ticket: OAuthRequestTicket
): Promise<string> =>
    new SignJWT({
        typ: OAUTH_REQUEST_TYP,
        request_id: ticket.requestId,
        client_id: ticket.clientId,
        client_name: ticket.clientName,
        client_did: ticket.clientDid,
        scope: ticket.scope,
    })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setIssuer(trimSlash(config.issuerUrl))
        .setAudience(OAUTH_REQUEST_AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(`${OAUTH_REQUEST_TTL_SECONDS}s`)
        .setJti(randomUUID())
        .sign(key(config.secret));

/** Signature, `typ`, `iss` (this brain's AS), `aud` and `exp`. */
export const verifyOAuthRequestTicket = async (
    config: OAuthConsentConfig,
    token: string
): Promise<VerifyResult<OAuthRequestTicket>> => {
    try {
        const { payload } = await jwtVerify(token, key(config.secret), {
            algorithms: ['HS256'],
            issuer: trimSlash(config.issuerUrl),
            audience: OAUTH_REQUEST_AUDIENCE,
            requiredClaims: ['exp'],
        });
        const { typ, request_id, client_id, client_name, client_did, scope } = payload;
        if (typ !== OAUTH_REQUEST_TYP) return { ok: false, error: 'wrong typ' };
        if (![request_id, client_id, client_name, client_did, scope].every(str))
            return { ok: false, error: 'missing claims' };
        return {
            ok: true,
            claims: {
                requestId: request_id as string,
                clientId: client_id as string,
                clientName: client_name as string,
                clientDid: client_did as string,
                scope: scope as string,
            },
        };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.name : 'invalid' };
    }
};

export const signConsentAssertion = async (
    config: OAuthConsentConfig,
    assertion: ConsentAssertion,
    ttlSeconds = CONSENT_ASSERTION_TTL_SECONDS
): Promise<string> =>
    new SignJWT({
        typ: CONSENT_ASSERTION_TYP,
        request_id: assertion.requestId,
        grant_id: assertion.grantId,
    })
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .setSubject(assertion.subjectDid)
        .setAudience(trimSlash(config.issuerUrl))
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
        .setJti(randomUUID())
        .sign(key(config.secret));

/** Signature, `typ`, `aud` (this AS's issuer URL) and `exp`. */
export const verifyConsentAssertion = async (
    config: OAuthConsentConfig,
    token: string
): Promise<VerifyResult<ConsentAssertion>> => {
    try {
        const { payload } = await jwtVerify(token, key(config.secret), {
            algorithms: ['HS256'],
            audience: trimSlash(config.issuerUrl),
            requiredClaims: ['exp', 'sub', 'jti'],
        });
        if (payload.typ !== CONSENT_ASSERTION_TYP) return { ok: false, error: 'wrong typ' };
        const { request_id, grant_id, sub } = payload;
        if (![request_id, grant_id, sub].every(str)) return { ok: false, error: 'missing claims' };
        return {
            ok: true,
            claims: {
                requestId: request_id as string,
                grantId: grant_id as string,
                subjectDid: sub as string,
            },
        };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error.name : 'invalid' };
    }
};

const DID = /^did:[a-z0-9]+:\S+$/;
const sameScopes = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((scope, index) => scope === b[index]);

const verifiedTicket = async (
    config: OAuthConsentConfig,
    token: string
): Promise<OAuthRequestTicket> => {
    const verified = await verifyOAuthRequestTicket(config, token);
    if (!verified.ok)
        throw malformed('The sign-in request is invalid or expired. Start again from the app.');
    if (!DID.test(verified.claims.clientDid) || verified.claims.clientDid.length > 2048)
        throw malformed('The sign-in request names an invalid client.');
    return verified.claims;
};

const completeUrlFor = (config: OAuthConsentConfig, assertion: string): string => {
    const url = new URL(`${trimSlash(config.issuerUrl)}/oauth/consent/complete`);
    url.searchParams.set('assertion', assertion);
    return url.toString();
};

/**
 * The signed-in subject allows an OAuth client: verify the AS's ticket, issue a fresh
 * grant to the client's DID, and sign the assertion the AS completes from.
 *
 * The subject is always the caller; nothing in the ticket can name another. Each
 * Allow gets a full OAUTH_GRANT_DURATION_MS: an earlier active direct grant to the
 * same client with exactly these scopes is revoked as superseded by the new one
 * (each revocation is its own audited transition), so a re-login neither keeps the
 * minutes the old grant had left nor piles up duplicates. Other grants are left alone.
 */
export const approveOAuthRequest = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: { ticket: string },
    config: OAuthConsentConfig
): Promise<{ completeUrl: string; grantId: string }> => {
    const subjectDid = requireSubject(caller);
    const ticket = await verifiedTicket(config, input.ticket);

    const scopes = parseScopeString(ticket.scope);
    const access = accessForScopes(scopes, {
        code: OAUTH_GRANT_PURPOSE_CODE,
        description: `Use your info in ${ticket.clientName}`.slice(0, 1000),
    });
    if (!access)
        throw malformed('The sign-in request asks for scopes this provider does not issue.');
    const wanted = scopesForAccess(access);

    const grant = await createGrant(deps, caller, {
        client: { id: ticket.clientDid, name: ticket.clientName.slice(0, 200) },
        access,
        grantType: 'temporary',
        expiresAt: new Date(deps.now().getTime() + OAUTH_GRANT_DURATION_MS).toISOString(),
        // Writes land as suggestions until the person accepts (LC-2423).
        canWrite: false,
        source: { type: 'direct' },
    });

    const earlier = (
        await Promise.all(
            (await deps.store.listGrants(subjectDid, 'active')).map(stored =>
                asItStands(deps, stored)
            )
        )
    ).filter(
        stored =>
            stored.grantId !== grant.grantId &&
            stored.status === 'active' &&
            stored.source.type === 'direct' &&
            stored.client.id === ticket.clientDid &&
            sameScopes(scopesForAccess(stored.access), wanted)
    );
    for (const stored of earlier) {
        const at = deps.now().toISOString();
        await deps.store.transitionGrantStatus(stored.grantId, 'revoked', at, {
            eventId: urn(deps.newId()),
            eventType: 'grant.revoked',
            timestamp: at,
            subjectDid,
            providerId: deps.providerId,
            initiator: { role: 'management-client', id: caller.did },
            entryId: null,
            categories: [],
            purpose: null,
            grantId: stored.grantId,
            data: { reason: 'superseded', supersededBy: grant.grantId },
        });
    }

    const assertion = await signConsentAssertion(config, {
        requestId: ticket.requestId,
        grantId: grant.grantId,
        subjectDid,
    });
    return { completeUrl: completeUrlFor(config, assertion), grantId: grant.grantId };
};
