/**
 * Standalone Express AS+RS for HCP OAuth Unit 1.
 *
 * Runs on a free high port against an injected HcpV1Store so Roadie's :4319 need
 * not restart. Fastify mount (docker-entry) can wrap the same controllers later.
 *
 * Consent is DID-authenticated: authorize hands off to the LearnCard app's
 * `/hcp/connect?oauth_request=<ticket>`, and `/oauth/consent/complete?assertion=`
 * finishes from the brain's signed assertion (Allow or Don't allow). Once a request's
 * client and redirect_uri are validated, errors redirect there with `state`. The
 * typed subject/grant form exists only with `devTypedConsent` outside production.
 */
import express, { type Express, type Request, type Response, type NextFunction } from 'express';

import type { HcpV1Deps } from '../v1/service/deps';
import type { HcpV1Store } from '../v1/store/port';
import {
    beginAuthorize,
    completeConsent,
    completeConsentFromAssertion,
    exchangeToken,
    registerClient,
    type AsDeps,
} from './as';
import {
    buildAuthorizationServerMetadata,
    buildProtectedResourceMetadata,
    DEFAULT_SCOPES_SUPPORTED,
} from './metadata';
import { hcpOAuthEnvironment } from './environment';
import { extractBearer, resolveBearerToGrant } from './rs';
import { createMemoryOAuthSessionStore, type HcpOAuthSessionStore } from './session-store';
import type { TokenSignerConfig } from './tokens';

export type CreateHcpOAuthAppOptions = {
    store: HcpV1Store;
    /** settleGrantExpiry needs these. */
    hcp: Pick<HcpV1Deps, 'store' | 'now' | 'newId' | 'providerId' | 'contracts'>;
    issuerUrl: string;
    resourceUrl?: string;
    tokenSecret: string;
    sessions?: HcpOAuthSessionStore;
    scopesSupported?: string[];
    accessTokenTtlSeconds?: number;
    now?: () => Date;
    /** The LearnCard app (origin, no trailing path) whose `/hcp/connect` takes consent. */
    consentAppUrl: string;
    /**
     * Local dev and tests only: serve the typed subject DID + grant id form at
     * `/oauth/consent` instead of handing off to the app. It authenticates nobody.
     * Refused when NODE_ENV is production.
     */
    devTypedConsent?: boolean;
};

const jsonError = (res: Response, status: number, error: string, description?: string) => {
    res.status(status).json({
        error,
        ...(description ? { error_description: description } : {}),
    });
};

/** Errors for a validated request go back to the client (RFC 6749 §4.1.2.1). */
const sendAsError = (
    res: Response,
    result: { status: number; error: string; error_description?: string; redirectUrl?: string }
) => {
    if (result.redirectUrl) return res.redirect(result.redirectUrl);
    return jsonError(res, result.status, result.error, result.error_description);
};

const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

const consentPage = (requestId: string): string => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><title>HCP OAuth consent (local)</title>
<style>
  body{font:14px/1.4 system-ui,sans-serif;max-width:36rem;margin:2rem auto;padding:0 1rem}
  label{display:block;margin:.75rem 0 .25rem;font-weight:600}
  input{width:100%;padding:.4rem;font:inherit}
  button{margin-top:1rem;padding:.5rem 1rem;font:inherit}
  .note{color:#444;font-size:12px;margin-top:1.5rem}
  code{background:#f4f4f4;padding:0 .2rem}
</style></head>
<body>
  <h1>HCP grant consent (dev typed form)</h1>
  <p>Select an <strong>already-issued</strong> active grant. Dev and tests only
  (<code>devTypedConsent</code>): this form authenticates nobody. Real consent runs in the
  LearnCard app (<code>/hcp/connect</code>) with DID auth.</p>
  <form method="post" action="/oauth/consent">
    <input type="hidden" name="request_id" value="${escapeHtml(requestId)}"/>
    <label for="subject_did">Subject DID</label>
    <input id="subject_did" name="subject_did" required placeholder="did:key:…"/>
    <label for="grant_id">Grant ID</label>
    <input id="grant_id" name="grant_id" required placeholder="urn:uuid:…"/>
    <button type="submit">Allow</button>
  </form>
  <p class="note">OAuth <code>client_id</code> identifies the MCP host. The token's
  <code>sub</code> is the grant's HCP client DID.</p>
</body></html>`;

export const createHcpOAuthApp = (options: CreateHcpOAuthAppOptions): Express => {
    if (options.devTypedConsent && hcpOAuthEnvironment().NODE_ENV === 'production') {
        throw new Error('devTypedConsent is not allowed when NODE_ENV is production');
    }
    const typedConsent = options.devTypedConsent === true;
    const issuerUrl = options.issuerUrl.replace(/\/$/, '');
    const resourceUrl = (options.resourceUrl ?? options.issuerUrl).replace(/\/$/, '');
    const sessions = options.sessions ?? createMemoryOAuthSessionStore();
    const tokenConfig: TokenSignerConfig = {
        secret: options.tokenSecret,
        issuerUrl,
        resourceUrl,
        accessTokenTtlSeconds: options.accessTokenTtlSeconds,
    };
    const scopesSupported = options.scopesSupported ?? DEFAULT_SCOPES_SUPPORTED;
    const asDeps: AsDeps = {
        store: options.store,
        sessions,
        tokens: tokenConfig,
        hcp: options.hcp,
        now: options.now,
        consentAppUrl: options.consentAppUrl,
        scopesSupported,
        typedConsent,
    };

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    app.get('/.well-known/oauth-protected-resource', (_req, res) => {
        res.json(buildProtectedResourceMetadata({ issuerUrl, resourceUrl }, scopesSupported));
    });

    app.get('/.well-known/oauth-authorization-server', (_req, res) => {
        res.json(buildAuthorizationServerMetadata({ issuerUrl, resourceUrl }, scopesSupported));
    });

    app.post('/oauth/register', async (req, res, next) => {
        try {
            const result = await registerClient(asDeps, req.body ?? {});
            if (!result.ok)
                return jsonError(res, result.status, result.error, result.error_description);
            res.status(201).json(result.data);
        } catch (error) {
            next(error);
        }
    });

    app.get('/oauth/authorize', async (req, res, next) => {
        try {
            const result = await beginAuthorize(asDeps, {
                client_id: typeof req.query.client_id === 'string' ? req.query.client_id : null,
                redirect_uri:
                    typeof req.query.redirect_uri === 'string' ? req.query.redirect_uri : null,
                response_type:
                    typeof req.query.response_type === 'string' ? req.query.response_type : null,
                code_challenge:
                    typeof req.query.code_challenge === 'string' ? req.query.code_challenge : null,
                code_challenge_method:
                    typeof req.query.code_challenge_method === 'string'
                        ? req.query.code_challenge_method
                        : null,
                state: typeof req.query.state === 'string' ? req.query.state : null,
                scope: typeof req.query.scope === 'string' ? req.query.scope : null,
                resource: typeof req.query.resource === 'string' ? req.query.resource : null,
            });
            if (!result.ok) return sendAsError(res, result);
            res.redirect(result.data.consentUrl);
        } catch (error) {
            next(error);
        }
    });

    app.get('/oauth/consent/complete', async (req, res, next) => {
        try {
            const assertion = typeof req.query.assertion === 'string' ? req.query.assertion : null;
            const result = await completeConsentFromAssertion(asDeps, assertion);
            if (!result.ok) return sendAsError(res, result);
            res.redirect(result.data.redirectUrl);
        } catch (error) {
            next(error);
        }
    });

    if (typedConsent) {
        app.get('/oauth/consent', async (req, res, next) => {
            try {
                const requestId =
                    typeof req.query.request_id === 'string' ? req.query.request_id : '';
                if (!requestId)
                    return jsonError(res, 400, 'invalid_request', 'request_id required');
                const pending = await sessions.getPending(requestId);
                if (!pending) {
                    return jsonError(res, 400, 'invalid_request', 'unknown or expired request_id');
                }
                res.type('html').send(consentPage(requestId));
            } catch (error) {
                next(error);
            }
        });

        app.post('/oauth/consent', async (req, res, next) => {
            try {
                const body = req.body ?? {};
                const result = await completeConsent(asDeps, {
                    requestId: String(body.request_id ?? ''),
                    subjectDid: String(body.subject_did ?? ''),
                    grantId: String(body.grant_id ?? ''),
                });
                if (!result.ok) return sendAsError(res, result);
                res.redirect(result.data.redirectUrl);
            } catch (error) {
                next(error);
            }
        });
    }

    app.post('/oauth/token', async (req, res, next) => {
        try {
            const body = req.body ?? {};
            const str = (value: unknown): string | null =>
                typeof value === 'string' ? value : null;
            const result = await exchangeToken(asDeps, {
                grant_type: str(body.grant_type),
                code: str(body.code),
                redirect_uri: str(body.redirect_uri),
                client_id: str(body.client_id),
                code_verifier: str(body.code_verifier),
                // Optional; do not coerce a non-string to null (that would
                // silently fall back to the authorization-time resource).
                resource: body.resource ?? null,
            });
            if (!result.ok)
                return jsonError(res, result.status, result.error, result.error_description);
            res.json(result.data);
        } catch (error) {
            next(error);
        }
    });

    /** Probe RS: proves bearer → grant without grantId in the body. Not an MCP tool. */
    app.get('/hcp/oauth/v1/probe', async (req, res, next) => {
        try {
            const token = extractBearer(req.header('authorization'));
            if (!token) {
                res.set(
                    'WWW-Authenticate',
                    `Bearer realm="hcp", resource_metadata="${resourceUrl}/.well-known/oauth-protected-resource"`
                );
                return jsonError(res, 401, 'invalid_token', 'Bearer token required');
            }
            const resolved = await resolveBearerToGrant(options.hcp, tokenConfig, token);
            if (!resolved.ok) {
                res.set(
                    'WWW-Authenticate',
                    `Bearer realm="hcp", error="${resolved.error}", resource_metadata="${resourceUrl}/.well-known/oauth-protected-resource"`
                );
                return jsonError(res, resolved.status, resolved.error);
            }
            const { auth } = resolved;
            res.json({
                grantId: auth.grant.grantId,
                subjectDid: auth.grant.subjectDid,
                clientDid: auth.clientDid,
                oauthClientId: auth.oauthClientId,
                status: auth.grant.status,
                scopes: auth.scopes,
                grantType: auth.grant.grantType,
                expiresAt: auth.grant.expiresAt,
            });
        } catch (error) {
            next(error);
        }
    });

    app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
        console.error('hcp-oauth', error);
        if (!res.headersSent) jsonError(res, 500, 'server_error');
    });

    return app;
};
