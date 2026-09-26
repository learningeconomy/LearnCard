import type { FastifyInstance } from 'fastify';

/**
 * LC-2187 public share-link HTTP adapter seam.
 *
 * The Fastify OpenAPI adapter has no `responseMeta` hook, so the no-store
 * contract for the anonymous public share-link routes is applied at the adapter
 * boundary itself. This module is deliberately free of the server bootstrap
 * (which listens on import) so a real Fastify instance can be exercised in
 * tests without starting the application.
 */

/**
 * Prefixes that identify a mounted public share-link OpenAPI request.
 *
 * The trpc-to-openapi Fastify adapter rewrites `request.raw.url` by stripping
 * its `/api` base path before the handler runs, so the `onSend` hook sees
 * `/public/share-links/...` even though the client requested
 * `/api/public/share-links/...`. Both forms are matched (with a path-boundary
 * check) so a sibling route such as `/public/share-links-other` is not treated
 * as public.
 */
const PUBLIC_SHARE_LINK_PREFIXES = ['/api/public/share-links', '/public/share-links'] as const;

/** True for the mounted public share-link OpenAPI route prefix only. */
export const isPublicShareLinkOpenApiRequestUrl = (url: string | undefined): boolean => {
    if (!url) return false;

    const path = url.split('?')[0] ?? '';

    return PUBLIC_SHARE_LINK_PREFIXES.some(
        prefix => path === prefix || path.startsWith(`${prefix}/`)
    );
};

/**
 * Installs the adapter-boundary `Cache-Control: private, no-store` on every
 * public share-link OpenAPI response, independent of any upstream cache layer.
 * It is safe to register on any Fastify instance (tRPC-only test apps included).
 */
export const registerPublicShareLinkNoStore = (app: FastifyInstance): void => {
    app.addHook('onSend', async (request, reply, payload) => {
        if (isPublicShareLinkOpenApiRequestUrl(request.raw.url)) {
            reply.header('Cache-Control', 'private, no-store');
        }

        return payload;
    });
};
