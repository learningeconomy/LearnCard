/**
 * HCP OAuth Authorization Server controllers (Draft 3 §13).
 *
 * Authorization Code + PKCE. Authorize hands the browser to the LearnCard app with a
 * signed request ticket; the signed-in person allows it there, the brain issues a
 * grant to the client's derived DID (deriveOAuthClientDid) and signs a consent
 * assertion; `/oauth/consent/complete` mints the code only from that assertion.
 * OAuth client_id identifies the MCP host; grant.client.id is its HCP Context Client DID.
 */
import type { HcpV1Store } from '../v1/store/port';
import { settleGrantExpiry } from '../v1/auth';
import type { HcpV1Deps } from '../v1/service/deps';
import { toGrant } from '../v1/service/grants';
import { signOAuthRequestTicket, verifyConsentAssertion } from '../v1/service/oauth-consent';
import { deriveOAuthClientDid } from './client-did';
import { verifyPkceS256 } from './pkce';
import { scopesForAccess, parseScopeString } from './scopes';
import {
    CODE_TTL_MS,
    newAuthorizationCode,
    newClientId,
    newRequestId,
    type HcpOAuthSessionStore,
} from './session-store';
import { mintAccessToken, type TokenSignerConfig } from './tokens';
import type { HcpOAuthClient, PendingAuthorization } from './types';

export type AsDeps = {
    store: HcpV1Store;
    sessions: HcpOAuthSessionStore;
    tokens: TokenSignerConfig;
    /** Minimal deps settleGrantExpiry needs. */
    hcp: Pick<HcpV1Deps, 'store' | 'now' | 'newId' | 'providerId' | 'contracts'>;
    now?: () => Date;
    /** The LearnCard app whose `/hcp/connect` takes the person's consent. */
    consentAppUrl: string;
    /** Scopes the AS issues (the PRM list). An empty request gets all of them. */
    scopesSupported: readonly string[];
    /** Dev/test only: authorize redirects to the local typed form instead of the app. */
    typedConsent?: boolean;
};

export type AsError = { ok: false; status: number; error: string; error_description?: string };
export type AsOk<T> = { ok: true; data: T };
export type AsResult<T> = AsOk<T> | AsError;

const fail = (status: number, error: string, error_description?: string): AsError => ({
    ok: false,
    status,
    error,
    error_description,
});

const exactRedirect = (client: HcpOAuthClient, redirectUri: string): boolean =>
    client.redirect_uris.includes(redirectUri);

export const registerClient = async (
    deps: AsDeps,
    body: {
        redirect_uris?: unknown;
        client_name?: unknown;
        token_endpoint_auth_method?: unknown;
        grant_types?: unknown;
        response_types?: unknown;
    }
): Promise<AsResult<HcpOAuthClient & { client_id_issued_at: number }>> => {
    const redirectUris = Array.isArray(body.redirect_uris)
        ? body.redirect_uris.filter((u): u is string => typeof u === 'string' && u.length > 0)
        : [];
    if (redirectUris.length === 0) {
        return fail(400, 'invalid_client_metadata', 'redirect_uris required');
    }

    const now = Math.floor((deps.now?.() ?? new Date()).getTime() / 1000);
    const client: HcpOAuthClient = {
        client_id: newClientId(),
        client_name: typeof body.client_name === 'string' ? body.client_name : undefined,
        redirect_uris: redirectUris,
        grant_types: ['authorization_code'],
        response_types: ['code'],
        token_endpoint_auth_method:
            typeof body.token_endpoint_auth_method === 'string'
                ? body.token_endpoint_auth_method
                : 'none',
        created_at: now,
    };
    await deps.sessions.saveClient(client);
    return { ok: true, data: { ...client, client_id_issued_at: now } };
};

export const beginAuthorize = async (
    deps: AsDeps,
    query: {
        client_id: string | null;
        redirect_uri: string | null;
        response_type: string | null;
        code_challenge: string | null;
        code_challenge_method: string | null;
        state: string | null;
        scope: string | null;
        resource: string | null;
    }
): Promise<AsResult<{ requestId: string; consentUrl: string }>> => {
    if (query.response_type !== 'code') {
        return fail(400, 'unsupported_response_type');
    }
    if (!query.client_id || !query.redirect_uri || !query.code_challenge) {
        return fail(400, 'invalid_request', 'client_id, redirect_uri, and code_challenge required');
    }
    if ((query.code_challenge_method ?? 'S256') !== 'S256') {
        return fail(400, 'invalid_request', 'code_challenge_method must be S256');
    }

    const client = await deps.sessions.getClient(query.client_id);
    if (!client) return fail(400, 'invalid_client');
    if (!exactRedirect(client, query.redirect_uri)) {
        return fail(400, 'invalid_request', 'redirect_uri must match exactly');
    }

    const requested = parseScopeString(query.scope);
    if (!requested.every(scope => deps.scopesSupported.includes(scope))) {
        return fail(400, 'invalid_scope', 'scope names a scope this provider does not issue');
    }

    const requestId = newRequestId();
    const pending: PendingAuthorization = {
        requestId,
        clientId: query.client_id,
        redirectUri: query.redirect_uri,
        state: query.state,
        codeChallenge: query.code_challenge,
        codeChallengeMethod: 'S256',
        scope: query.scope,
        resource: query.resource,
        // Wall clock: session TTL must not follow the HCP store's injectable now().
        createdAt: Date.now(),
    };
    await deps.sessions.savePending(pending);

    if (deps.typedConsent) {
        return {
            ok: true,
            data: { requestId, consentUrl: `/oauth/consent?request_id=${requestId}` },
        };
    }

    // Signed, so the app can show the client and scopes and the brain can trust them.
    const ticket = await signOAuthRequestTicket(
        { issuerUrl: deps.tokens.issuerUrl, secret: deps.tokens.secret },
        {
            requestId,
            clientId: client.client_id,
            clientName: client.client_name || client.client_id,
            clientDid: deriveOAuthClientDid(deps.tokens.issuerUrl, client.client_id),
            scope: (requested.length > 0 ? requested : [...deps.scopesSupported].sort()).join(' '),
        }
    );
    const consentUrl = new URL(`${deps.consentAppUrl.replace(/\/$/, '')}/hcp/connect`);
    consentUrl.searchParams.set('oauth_request', ticket);
    return { ok: true, data: { requestId, consentUrl: consentUrl.toString() } };
};

/**
 * Binds an active grant to the pending OAuth request and mints the code. The pending
 * request is taken first, so each request_id completes (or fails) at most once.
 * `subjectDid` must come from authenticated consent (completeConsentFromAssertion);
 * only the dev typed form passes it from a form body. With `bindClient`, the grant
 * must be issued to this OAuth client's derived DID.
 */
export const completeConsent = async (
    deps: AsDeps,
    input: { requestId: string; subjectDid: string; grantId: string; bindClient?: boolean }
): Promise<AsResult<{ redirectUrl: string }>> => {
    const pending = await deps.sessions.takePending(input.requestId);
    if (!pending) return fail(400, 'invalid_request', 'unknown or expired request_id');

    const stored = await deps.store.getGrant(input.grantId);
    if (!stored || stored.subjectDid !== input.subjectDid) {
        return fail(400, 'access_denied', 'grant not found for subject');
    }
    if (
        input.bindClient &&
        stored.client.id !== deriveOAuthClientDid(deps.tokens.issuerUrl, pending.clientId)
    ) {
        return fail(400, 'access_denied', 'grant was not issued to this client');
    }

    const grant = await settleGrantExpiry(deps.hcp as HcpV1Deps, stored);
    if (grant.status !== 'active' || grant.access.length === 0) {
        return fail(400, 'access_denied', 'grant is not active');
    }

    const live = toGrant(grant);
    const requested = parseScopeString(pending.scope);
    const grantedScopes = live.scopes;
    if (requested.length > 0 && !requested.every(scope => grantedScopes.includes(scope))) {
        return fail(400, 'invalid_scope', 'requested scope exceeds the selected grant');
    }

    const scope = (requested.length > 0 ? requested : grantedScopes).join(' ');
    const resource =
        pending.resource?.replace(/\/$/, '') || deps.tokens.resourceUrl.replace(/\/$/, '');

    const code = newAuthorizationCode();
    await deps.sessions.saveCode({
        code,
        clientId: pending.clientId,
        redirectUri: pending.redirectUri,
        codeChallenge: pending.codeChallenge,
        codeChallengeMethod: pending.codeChallengeMethod,
        grantId: grant.grantId,
        subjectDid: grant.subjectDid,
        clientDid: grant.client.id,
        scope,
        resource,
        expiresAt: Date.now() + CODE_TTL_MS,
    });

    const url = new URL(pending.redirectUri);
    url.searchParams.set('code', code);
    if (pending.state) url.searchParams.set('state', pending.state);
    return { ok: true, data: { redirectUrl: url.toString() } };
};

/**
 * `/oauth/consent/complete`: the subject comes only from the brain's signed consent
 * assertion (signature, typ, aud = this issuer, exp). Replay fails: the pending
 * request it names was taken on first use.
 */
export const completeConsentFromAssertion = async (
    deps: AsDeps,
    assertion: string | null
): Promise<AsResult<{ redirectUrl: string }>> => {
    if (!assertion) return fail(400, 'invalid_request', 'assertion required');
    const verified = await verifyConsentAssertion(
        { issuerUrl: deps.tokens.issuerUrl, secret: deps.tokens.secret },
        assertion
    );
    if (!verified.ok) return fail(400, 'access_denied', 'invalid or expired consent assertion');
    return completeConsent(deps, {
        requestId: verified.claims.requestId,
        subjectDid: verified.claims.subjectDid,
        grantId: verified.claims.grantId,
        bindClient: true,
    });
};

export const exchangeToken = async (
    deps: AsDeps,
    body: {
        grant_type: string | null;
        code: string | null;
        redirect_uri: string | null;
        client_id: string | null;
        code_verifier: string | null;
        resource: string | null;
    }
): Promise<
    AsResult<{
        access_token: string;
        token_type: 'Bearer';
        expires_in: number;
        scope: string;
    }>
> => {
    if (body.grant_type !== 'authorization_code') {
        return fail(400, 'unsupported_grant_type');
    }
    // Validate types before takeCode: a non-string resource used to throw after
    // the one-time code was consumed, turning a bad request into a 500.
    if (
        typeof body.code !== 'string' ||
        typeof body.redirect_uri !== 'string' ||
        typeof body.client_id !== 'string' ||
        typeof body.code_verifier !== 'string' ||
        (body.resource !== null && typeof body.resource !== 'string')
    ) {
        return fail(400, 'invalid_request');
    }
    if (!body.code || !body.redirect_uri || !body.client_id || !body.code_verifier) {
        return fail(400, 'invalid_request');
    }

    const client = await deps.sessions.getClient(body.client_id);
    if (!client) return fail(401, 'invalid_client');

    const record = await deps.sessions.takeCode(body.code);
    if (!record || record.clientId !== body.client_id || record.redirectUri !== body.redirect_uri) {
        return fail(400, 'invalid_grant');
    }
    if (!verifyPkceS256(body.code_verifier, record.codeChallenge)) {
        return fail(400, 'invalid_grant', 'PKCE verification failed');
    }

    // Audience-restrict to the resource named at authorize/consent (§13.3).
    const resource = (body.resource ?? record.resource).replace(/\/$/, '');
    if (resource !== deps.tokens.resourceUrl.replace(/\/$/, '')) {
        return fail(400, 'invalid_target', 'resource does not match this HCP provider');
    }

    // Re-check live grant at mint time.
    const stored = await deps.store.getGrant(record.grantId);
    if (!stored) return fail(400, 'invalid_grant');
    const grant = await settleGrantExpiry(deps.hcp as HcpV1Deps, stored);
    if (grant.status !== 'active') return fail(400, 'invalid_grant', 'grant no longer active');

    // Token iat/exp use wall clock (jose verifies against Date.now). Grant liveness
    // still uses the injectable HCP clock via settleGrantExpiry above.
    const minted = await mintAccessToken(
        { ...deps.tokens, resourceUrl: resource },
        {
            grantId: grant.grantId,
            clientDid: grant.client.id,
            oauthClientId: body.client_id,
            scope: record.scope || scopesForAccess(grant.access).join(' '),
        }
    );

    return {
        ok: true,
        data: {
            access_token: minted.accessToken,
            token_type: 'Bearer',
            expires_in: minted.expiresIn,
            scope: minted.claims.scope,
        },
    };
};
