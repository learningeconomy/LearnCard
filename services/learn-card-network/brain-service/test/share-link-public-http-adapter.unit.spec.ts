import Fastify, { type FastifyInstance } from 'fastify';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { fastifyTRPCOpenApiPlugin } from 'trpc-to-openapi';
import { describe, expect, it, vi } from 'vitest';

/**
 * LC-2187 real local HTTP adapter evidence.
 *
 * These tests build an actual Fastify instance using the SAME tRPC and
 * trpc-to-openapi adapters the service registers, with the production
 * adapter-boundary no-store hook. Backing services are injected fakes and no
 * server bootstrap (`docker-entry`) is imported or listened on. This is local
 * adapter evidence only; no deployed ingress is claimed.
 */

vi.mock('@sentry/serverless', () => ({
    Handlers: {
        trpcMiddleware: vi.fn(() => async (opts: { next: () => unknown }) => opts.next()),
    },
    setUser: vi.fn(),
    configureScope: vi.fn(),
}));

vi.mock('@accesslayer/profile/read', () => ({
    getProfileByDid: vi.fn(async () => null),
    getProfileByProfileId: vi.fn(async () => null),
}));

vi.mock('@helpers/rateLimit.helpers', () => ({
    enforceRateLimits: vi.fn(async () => undefined),
}));

import { t, publicShareLinkCacheControlHeaders } from '../src/routes';
import {
    createPublicShareLinksRouter,
    publicShareContentUrl,
} from '../src/routes/public-share-links';
import {
    isPublicShareLinkOpenApiRequestUrl,
    registerPublicShareLinkNoStore,
} from '../src/public-share-link-http';
import { createOpenApiAwsLambdaHandler } from '../src/helpers/shim';
import type { PublicShareLinkRouterDependencies } from '../src/routes/public-share-links';
import type { ShareLinkRecord } from '../src/models/ShareLink';
import type { APIGatewayProxyEventV2, Context as AWSContext } from 'aws-lambda';

const NAMESPACE = 'deployment-ns';
const SHARE_ID = Buffer.alloc(16, 7).toString('base64url');
const OPERATION_ID = '0f5a2c1e-1c2b-4c3d-8e4f-5a6b7c8d9e0f';
const RECEIPT = Buffer.alloc(32, 9).toString('base64url');

const shareRecord = (overrides: Partial<ShareLinkRecord> = {}): ShareLinkRecord => ({
    id: SHARE_ID,
    namespace: NAMESPACE,
    ownerProfileId: 'owner-1',
    version: 3,
    contentVersion: 2,
    generation: 4,
    status: 'active',
    contentState: 'finalized',
    activeObjectRef: 'internal-object-ref',
    activeObjectOperationId: OPERATION_ID,
    activeContentHash: 'internal-content-hash',
    activeContentBytes: 123,
    activeRecoveryHash: 'internal-recovery-hash',
    lastOperationId: OPERATION_ID,
    createdByClientRequestId: 'client-request-id',
    title: 'Shared credentials',
    note: 'hello',
    selectedCount: 2,
    expiresAt: null,
    stoppedAt: null,
    viewCount: 0,
    lastViewedAt: null,
    minorPolicyIsMinor: null,
    minorPolicyResolved: false,
    minorPolicyDefaultExpiryDays: 30,
    minorPolicyViewCountingEnabled: false,
    createdAt: '2026-09-20T00:00:00.000Z',
    updatedAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
});

const makeDependencies = (
    overrides: Partial<PublicShareLinkRouterDependencies['repository']> = {}
): PublicShareLinkRouterDependencies => {
    const record = shareRecord();

    return {
        namespace: NAMESPACE,
        repository: {
            getShareLink: vi.fn(async () => record),
            fetchContent: vi.fn(async () => ({
                ok: false as const,
                error: 'UNAVAILABLE',
            })),
            ...overrides,
        },
        receipts: {
            persist: vi.fn(async () => false),
            lookupOwner: vi.fn(async () => null),
            consume: vi.fn(async () => 'ineligible' as const),
        },
        policyResolver: {
            resolve: vi.fn(async () => ({
                isMinor: null,
                policyResolved: false,
                defaultExpiryDays: 30 as const,
                viewCountingEnabled: false,
            })),
        },
        getSharer: vi.fn(async () => ({ displayName: 'Owner One' })),
        enforceRateLimit: vi.fn(async () => undefined),
        contentUrlFor: publicShareContentUrl,
        newReceipt: () => RECEIPT,
        now: () => new Date('2026-09-21T00:00:00.000Z'),
        reportFailure: vi.fn(),
    };
};

const buildApp = async (
    dependencies: PublicShareLinkRouterDependencies
): Promise<FastifyInstance> => {
    const router = t.router({
        publicShareLinks: createPublicShareLinksRouter(async () => dependencies),
        // A genuinely unrelated procedure used only to prove the negative case.
        other: t.procedure.query(() => 'ok'),
    });
    const createContext = async () => ({}) as never;

    const app = Fastify();
    registerPublicShareLinkNoStore(app);
    await app.register(fastifyTRPCOpenApiPlugin, {
        basePath: '/api',
        router,
        createContext,
        onError() {
            // Keep adapter error output deterministic in tests.
        },
    } satisfies Parameters<typeof fastifyTRPCOpenApiPlugin>[1]);
    await app.register(fastifyTRPCPlugin, {
        prefix: '/trpc',
        trpcOptions: {
            router,
            createContext,
            responseMeta: ({ paths }) => ({
                headers: publicShareLinkCacheControlHeaders(paths),
            }),
        },
    });
    await app.ready();

    return app;
};

describe('public share-link request path predicate', () => {
    it('matches only the mounted public prefix and ignores the query string', () => {
        expect(isPublicShareLinkOpenApiRequestUrl('/api/public/share-links/abc')).toBe(true);
        expect(isPublicShareLinkOpenApiRequestUrl('/api/public/share-links/abc?x=1')).toBe(true);
        expect(isPublicShareLinkOpenApiRequestUrl('/api/public/share-links')).toBe(true);
        // The Fastify adapter strips the /api base path before onSend.
        expect(isPublicShareLinkOpenApiRequestUrl('/public/share-links/abc/content')).toBe(true);
        expect(isPublicShareLinkOpenApiRequestUrl('/api/share-links/abc')).toBe(false);
        expect(isPublicShareLinkOpenApiRequestUrl('/public/share-links-other')).toBe(false);
        expect(isPublicShareLinkOpenApiRequestUrl(undefined)).toBe(false);
    });
});

describe('Fastify OpenAPI public share-link adapter', () => {
    it('returns a success response with an adapter-boundary no-store header', async () => {
        const app = await buildApp(makeDependencies());

        const response = await app.inject({
            method: 'GET',
            url: `/api/public/share-links/${SHARE_ID}`,
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['cache-control']).toBe('private, no-store');
        expect(response.json()).toMatchObject({ state: 'active', id: SHARE_ID });
    });

    it('returns a failure response with the no-store header', async () => {
        const app = await buildApp(makeDependencies());

        const response = await app.inject({
            method: 'GET',
            url: `/api/public/share-links/${SHARE_ID}/content`,
        });

        expect(response.statusCode).toBe(503);
        expect(response.headers['cache-control']).toBe('private, no-store');
    });

    it('does not add the public no-store header to another OpenAPI route', async () => {
        const app = await buildApp(makeDependencies());

        const response = await app.inject({ method: 'GET', url: '/api/not-a-public-route' });

        expect(response.statusCode).toBe(404);
        expect(response.headers['cache-control']).toBeUndefined();
    });

    it('serves the returned content URL on the mounted /api base path', async () => {
        const app = await buildApp(makeDependencies());

        const response = await app.inject({
            method: 'GET',
            url: publicShareContentUrl(SHARE_ID),
        });

        expect(publicShareContentUrl(SHARE_ID)).toBe(`/api/public/share-links/${SHARE_ID}/content`);
        expect(response.statusCode).toBe(503);
        expect(response.headers['cache-control']).toBe('private, no-store');
    });
});

describe('Fastify tRPC public share-link adapter', () => {
    it('sets the no-store header from responseMeta on success', async () => {
        const app = await buildApp(makeDependencies());

        const response = await app.inject({
            method: 'GET',
            url: `/trpc/publicShareLinks.resolve?input=${encodeURIComponent(
                JSON.stringify({ id: SHARE_ID })
            )}`,
        });

        expect(response.statusCode).toBe(200);
        expect(response.headers['cache-control']).toBe('private, no-store');
    });

    it('sets the no-store header from responseMeta on a handled failure', async () => {
        const app = await buildApp(makeDependencies());

        const response = await app.inject({
            method: 'GET',
            url: `/trpc/publicShareLinks.content?input=${encodeURIComponent(
                JSON.stringify({ id: SHARE_ID })
            )}`,
        });

        expect(response.headers['cache-control']).toBe('private, no-store');
    });

    it('does not set the public no-store header for an unrelated tRPC path', async () => {
        const app = await buildApp(makeDependencies());

        const response = await app.inject({ method: 'GET', url: '/trpc/other' });

        expect(response.statusCode).toBe(200);
        expect(response.headers['cache-control']).not.toBe('private, no-store');
    });
});

const buildLambdaHandler = (dependencies: PublicShareLinkRouterDependencies) => {
    const router = t.router({
        publicShareLinks: createPublicShareLinksRouter(async () => dependencies),
    });

    return createOpenApiAwsLambdaHandler({
        router,
        createContext: async () => ({}) as never,
        responseMeta: ({ paths }) => ({
            headers: publicShareLinkCacheControlHeaders(paths),
        }),
    });
};

const eventFor = (path: string): APIGatewayProxyEventV2 =>
    ({
        version: '2.0',
        rawPath: path,
        rawQueryString: '',
        headers: {},
        requestContext: { http: { method: 'GET' } },
    }) as unknown as APIGatewayProxyEventV2;

const headerValue = (
    headers: Record<string, string> | undefined,
    name: string
): string | undefined => {
    const entry = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === name);

    return entry?.[1];
};

describe('Lambda OpenAPI shim public share-link headers', () => {
    it('sets the production no-store header on a successful resolve response', async () => {
        const handler = buildLambdaHandler(makeDependencies());

        const result = await handler(eventFor(`/public/share-links/${SHARE_ID}`), {} as AWSContext);

        expect(result.statusCode).toBe(200);
        expect(headerValue(result.headers, 'cache-control')).toBe('private, no-store');
    });

    it('sets the production no-store header on a handled content failure', async () => {
        const handler = buildLambdaHandler(makeDependencies());

        const result = await handler(
            eventFor(`/public/share-links/${SHARE_ID}/content`),
            {} as AWSContext
        );

        expect(result.statusCode).toBe(503);
        expect(headerValue(result.headers, 'cache-control')).toBe('private, no-store');
    });
});
