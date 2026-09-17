/**
 * OIDC OAuth surface for the lca-api provider (AD-2), served as a Fastify
 * plugin so it can issue real 302 redirects and read form-encoded bodies —
 * things the tRPC/OpenAPI layer cannot do. Dual-mounted in the standalone
 * Docker entry (`docker-entry.ts`) and the Lambda handler (`lambda.ts`),
 * mirroring `src/dids.ts`.
 *
 * Endpoints (at the issuer root):
 *  - GET  /.well-known/openid-configuration — discovery
 *  - GET  /oidc/jwks — public signing keys
 *  - GET  /oidc/authorize — redeem a `login_hint` login ticket, 302 back to the
 *         relying party's `redirect_uri` with a one-time `code`. Invalid /
 *         expired ticket → `error=login_required`.
 *  - POST /oidc/token — confidential-client-authenticated exchange of a `code`
 *         for a signed `id_token` + opaque `access_token`.
 *  - GET  /oidc/userinfo — resolve an opaque `access_token` to verified claims.
 */

import Fastify, { type FastifyPluginAsync } from 'fastify';
import formbody from '@fastify/formbody';
import { environment } from '@environment';
import { redeemLoginTicket } from '@cache/login-tickets';

import {
    getOidcClientId,
    getOidcDiscoveryDocument,
    getOidcJwks,
    getOidcIssuer,
    isAllowedRedirectUri,
    mintIdToken,
    verifyOidcClientCredentials,
} from '@helpers/oidc.helpers';
import {
    generateAuthorizationCode,
    storeAuthorizationCode,
    consumeAuthorizationCode,
    generateAccessToken,
    storeAccessToken,
    getAccessToken,
    type AuthorizationCodeData,
    type AccessTokenData,
} from '@helpers/login-ticket.helpers';

const appendParams = (redirectUri: string, params: Record<string, string>): string => {
    const url = new URL(redirectUri);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url.toString();
};

export const oidcFastifyPlugin: FastifyPluginAsync = async fastify => {
    await fastify.register(formbody);
    fastify.addHook('onRequest', async (_request, reply) => {
        reply.header('Cache-Control', 'no-store');
        reply.header('Pragma', 'no-cache');
        try {
            getOidcIssuer();
            await getOidcJwks();
        } catch {
            return reply.status(503).send({ error: 'server_error' });
        }
    });
    fastify.setErrorHandler((_error, _request, reply) => {
        return reply.status(500).send({ error: 'server_error' });
    });

    fastify.get('/.well-known/openid-configuration', async (_request, reply) => {
        return reply.send(getOidcDiscoveryDocument());
    });

    fastify.get('/oidc/jwks', async (_request, reply) => {
        reply.header('Cache-Control', 'public, max-age=300');
        return reply.send(await getOidcJwks());
    });

    fastify.get('/oidc/authorize', async (request, reply) => {
        const query = request.query as Record<string, string | undefined>;
        const redirectUri = query.redirect_uri;
        const state = query.state;
        const responseType = query.response_type;
        const clientId = query.client_id;
        const loginHint = query.login_hint;
        const nonce = query.nonce;

        if (clientId !== getOidcClientId() || !redirectUri || !isAllowedRedirectUri(redirectUri)) {
            return reply.status(400).send({ error: 'invalid_request' });
        }

        const failRedirect = (error: string): string =>
            appendParams(redirectUri, state ? { error, state } : { error });

        if (responseType !== 'code') {
            return reply.redirect(failRedirect('unsupported_response_type'));
        }

        if (!query.scope?.split(/\s+/).includes('openid')) {
            return reply.redirect(failRedirect('invalid_scope'));
        }

        if (!loginHint) {
            return reply.redirect(failRedirect('login_required'));
        }

        const ticket = await redeemLoginTicket(loginHint);
        if (!ticket) {
            return reply.redirect(failRedirect('login_required'));
        }

        const code = generateAuthorizationCode();
        const codeData: AuthorizationCodeData = {
            code,
            scope: query.scope,
            clientId,
            redirectUri,
            nonce,
            state,
            subject: ticket.subject,
            email: ticket.email,
            emailVerified: ticket.emailVerified,
            phoneNumber: ticket.phoneNumber,
            phoneNumberVerified: ticket.phoneNumberVerified,
            name: ticket.name,
            picture: ticket.picture,
            createdAt: Date.now(),
        };
        await storeAuthorizationCode(codeData);

        return reply.redirect(appendParams(redirectUri, state ? { code, state } : { code }));
    });

    fastify.post('/oidc/token', async (request, reply) => {
        if (!environment.OIDC_CLIENT_SECRET) {
            return reply.status(503).send({ error: 'server_error' });
        }
        const body = (request.body ?? {}) as Record<string, string | undefined>;

        let clientId = body.client_id;
        let clientSecret = body.client_secret;

        const authorization = request.headers.authorization;
        if (authorization) {
            clientId = undefined;
            clientSecret = undefined;
            try {
                if (/^Basic /i.test(authorization)) {
                    const decoded = Buffer.from(authorization.slice(6), 'base64').toString('utf8');
                    const separator = decoded.indexOf(':');
                    if (separator >= 0) {
                        clientId = decodeURIComponent(
                            decoded.slice(0, separator).replace(/\+/g, ' ')
                        );
                        clientSecret = decodeURIComponent(
                            decoded.slice(separator + 1).replace(/\+/g, ' ')
                        );
                    }
                }
            } catch {
                clientId = undefined;
                clientSecret = undefined;
            }
        }

        if (
            typeof clientId !== 'string' ||
            typeof clientSecret !== 'string' ||
            !verifyOidcClientCredentials(clientId, clientSecret)
        ) {
            return reply
                .header('WWW-Authenticate', 'Basic realm="oidc"')
                .status(401)
                .send({ error: 'invalid_client' });
        }

        if (body.grant_type !== 'authorization_code') {
            return reply.status(400).send({ error: 'unsupported_grant_type' });
        }
        if (typeof body.code !== 'string' || !body.code || typeof body.redirect_uri !== 'string') {
            return reply.status(400).send({ error: 'invalid_request' });
        }

        const codeData = await consumeAuthorizationCode(body.code);
        if (!codeData || codeData.clientId !== clientId) {
            return reply.status(400).send({ error: 'invalid_grant' });
        }
        if (!body.redirect_uri || body.redirect_uri !== codeData.redirectUri) {
            return reply.status(400).send({ error: 'invalid_grant' });
        }

        const { token, expiresAt } = await mintIdToken({
            subject: codeData.subject,
            nonce: codeData.nonce,
            email: codeData.email,
            emailVerified: codeData.emailVerified,
            phoneNumber: codeData.phoneNumber,
            phoneNumberVerified: codeData.phoneNumberVerified,
            name: codeData.name,
            picture: codeData.picture,
        });

        const accessToken = generateAccessToken();
        const accessData: AccessTokenData = {
            subject: codeData.subject,
            email: codeData.email,
            emailVerified: codeData.emailVerified,
            phoneNumber: codeData.phoneNumber,
            phoneNumberVerified: codeData.phoneNumberVerified,
            name: codeData.name,
            picture: codeData.picture,
            createdAt: Date.now(),
        };
        await storeAccessToken(accessToken, accessData);

        reply.header('Cache-Control', 'no-store');
        reply.header('Pragma', 'no-cache');
        return reply.send({
            access_token: accessToken,
            id_token: token,
            token_type: 'Bearer',
            scope: codeData.scope,
            expires_in: Math.max(0, expiresAt - Math.floor(Date.now() / 1000)),
        });
    });

    fastify.get('/oidc/userinfo', async (request, reply) => {
        const authorization = request.headers.authorization;
        if (!authorization?.startsWith('Bearer ')) {
            return reply
                .header('WWW-Authenticate', 'Bearer error="invalid_token"')
                .status(401)
                .send({ error: 'invalid_token' });
        }

        const accessToken = authorization.slice('Bearer '.length).trim();
        const data = await getAccessToken(accessToken);
        if (!data) {
            return reply
                .header('WWW-Authenticate', 'Bearer error="invalid_token"')
                .status(401)
                .send({ error: 'invalid_token' });
        }

        const claims: Record<string, unknown> = { sub: data.subject };
        if (data.email !== undefined) claims.email = data.email;
        if (data.emailVerified !== undefined) claims.email_verified = data.emailVerified;
        if (data.phoneNumber !== undefined) claims.phone_number = data.phoneNumber;
        if (data.phoneNumberVerified !== undefined) {
            claims.phone_number_verified = data.phoneNumberVerified;
        }
        if (data.name !== undefined) claims.name = data.name;
        if (data.picture !== undefined) claims.picture = data.picture;

        return reply.send(claims);
    });
};

export const app = Fastify();
app.register(oidcFastifyPlugin);
