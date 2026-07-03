import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';

import { SESSION_COOKIE_NAME, readSessionCookie, signSessionCookie } from '@session';
import { didWebFromDomain, type DidDocumentService } from '@did';

import type { ConsoleAuthService } from './app';

export type ConsoleBffServerConfig = {
    authService: ConsoleAuthService;
    cookieSecret: string;
    secureCookies?: boolean;
    didDocuments?: DidDocumentService;
};

export function buildServer(config: ConsoleBffServerConfig): FastifyInstance {
    const app = Fastify({ logger: true });

    app.register(cookie);

    const tenantIdOf = (headers: Record<string, unknown>): string =>
        (headers['x-tenant-id'] as string) ?? process.env.DEFAULT_TENANT_ID ?? 'learncard';

    app.get('/health', async () => ({ status: 'ok' }));

    if (config.didDocuments) {
        const didDocuments = config.didDocuments;

        app.get<{ Params: { profileId: string } }>(
            '/p/:profileId/did.json',
            async (request, reply) => {
                const did = didWebFromDomain(request.hostname, request.params.profileId);
                const doc = await didDocuments.resolve(did);

                if (!doc) return reply.code(404).send({ error: 'not_found' });

                return reply.header('content-type', 'application/did+json').send(doc);
            }
        );
    }

    app.post<{ Body: { providerId: string; redirectUri: string; state?: string } }>(
        '/auth/login',
        async (request, reply) => {
            const { providerId, redirectUri, state } = request.body;
            const result = await config.authService.beginLogin({
                tenantId: tenantIdOf(request.headers),
                providerId,
                redirectUri,
                state,
            });

            return reply.send(result);
        }
    );

    app.post<{ Body: { providerId: string; params: Record<string, string> } }>(
        '/auth/callback',
        async (request, reply) => {
            const session = await config.authService.completeLogin({
                tenantId: tenantIdOf(request.headers),
                providerId: request.body.providerId,
                params: request.body.params,
            });

            reply.setCookie(
                SESSION_COOKIE_NAME,
                signSessionCookie(session.sessionId, config.cookieSecret),
                {
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: config.secureCookies ?? true,
                    path: '/',
                }
            );

            return reply.send({ profileId: session.profileId, expiresAt: session.expiresAt });
        }
    );

    app.get('/auth/session', async (request, reply) => {
        const sessionId = readSessionCookie(
            request.cookies[SESSION_COOKIE_NAME],
            config.cookieSecret
        );

        if (!sessionId) return reply.code(401).send({ error: 'no_session' });

        const session = await config.authService.getSession(sessionId);

        if (!session) return reply.code(401).send({ error: 'no_session' });

        return reply.send(session);
    });

    app.post('/auth/logout', async (request, reply) => {
        const sessionId = readSessionCookie(
            request.cookies[SESSION_COOKIE_NAME],
            config.cookieSecret
        );

        if (sessionId) await config.authService.logout(sessionId);

        reply.clearCookie(SESSION_COOKIE_NAME, { path: '/' });

        return reply.send({ ok: true });
    });

    return app;
}
