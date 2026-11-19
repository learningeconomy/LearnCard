/**
 * Standalone Express AS+RS for HCP OAuth Unit 1.
 *
 * Runs on a free high port against an injected HcpV1Store so Roadie's :4319 need
 * not restart. Fastify mount (docker-entry) can wrap the same controllers later.
 */
import express, { type Express, type Request, type Response, type NextFunction } from 'express';

import type { HcpV1Deps } from '../v1/service/deps';
import type { HcpV1Store } from '../v1/store/port';
import { beginAuthorize, completeConsent, exchangeToken, registerClient, type AsDeps } from './as';
import {
    buildAuthorizationServerMetadata,
    buildProtectedResourceMetadata,
    DEFAULT_SCOPES_SUPPORTED,
} from './metadata';
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
};

const jsonError = (res: Response, status: number, error: string, description?: string) => {
    res.status(status).json({
        error,
        ...(description ? { error_description: description } : {}),
    });
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
  <h1>HCP grant consent (Unit 1 local)</h1>
  <p>Select an <strong>already-issued</strong> active grant. This page is for local Claude Code /
  curl only; production must use DID-authenticated consent (Draft 3 §6.1.6).</p>
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
    const issuerUrl = options.issuerUrl.replace(/\/$/, '');
    const resourceUrl = (options.resourceUrl ?? options.issuerUrl).replace(/\/$/, '');
    const sessions = options.sessions ?? createMemoryOAuthSessionStore();
    const tokenConfig: TokenSignerConfig = {
        secret: options.tokenSecret,
        issuerUrl,
        resourceUrl,
        accessTokenTtlSeconds: options.accessTokenTtlSeconds,
    };
    const asDeps: AsDeps = {
        store: options.store,
        sessions,
        tokens: tokenConfig,
        hcp: options.hcp,
        now: options.now,
    };
    const scopesSupported = options.scopesSupported ?? DEFAULT_SCOPES_SUPPORTED;

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
            if (!result.ok)
                return jsonError(res, result.status, result.error, result.error_description);
            res.redirect(result.data.consentPath);
        } catch (error) {
            next(error);
        }
    });

    app.get('/oauth/consent', async (req, res, next) => {
        try {
            const requestId = typeof req.query.request_id === 'string' ? req.query.request_id : '';
            if (!requestId) return jsonError(res, 400, 'invalid_request', 'request_id required');
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
            if (!result.ok)
                return jsonError(res, result.status, result.error, result.error_description);
            res.redirect(result.data.redirectUrl);
        } catch (error) {
            next(error);
        }
    });

    app.post('/oauth/token', async (req, res, next) => {
        try {
            const body = req.body ?? {};
            const result = await exchangeToken(asDeps, {
                grant_type: body.grant_type ?? null,
                code: body.code ?? null,
                redirect_uri: body.redirect_uri ?? null,
                client_id: body.client_id ?? null,
                code_verifier: body.code_verifier ?? null,
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
