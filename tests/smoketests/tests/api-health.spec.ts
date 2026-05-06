import { test, expect, type APIRequestContext } from '@playwright/test';
import { resolveUrls } from '../lib/resolveUrls';

const { api: API_URL, cloud: CLOUD_URL, lcaApi: LCA_API_URL } = resolveUrls();

// DID / docs / tRPC live at the service root, not under /api. Strip once.
const stripApi = (u: string) => u.replace(/\/api\/?$/, '');
const BRAIN_ROOT = stripApi(API_URL);
const CLOUD_ROOT = stripApi(CLOUD_URL);
const LCA_ROOT = stripApi(LCA_API_URL);

// A plain HTTP liveness probe (/health-check) can succeed while the tRPC
// router is broken — they're independent handlers, and we've been bitten by
// that before. This asserts the tRPC HTTP adapter itself is mounted and
// serving by probing an unknown procedure and verifying the response is
// tRPC's own JSON-RPC error envelope:
//
//   { "error": { "code": -32004, "data": { "code": "NOT_FOUND", ... } } }
//
// An upstream 404 from API Gateway / CloudFront / NGINX has a different
// shape (HTML or a generic JSON error), so this distinguishes "the host
// responds" from "tRPC responds".
const PROBE_PATH = '__smoketest_probe';

const expectTrpcReachable = async (request: APIRequestContext, rootUrl: string) => {
    const response = await request.get(`${rootUrl}/trpc/${PROBE_PATH}`);

    // tRPC returns 404 for unknown procedures. Any 5xx or an upstream-shaped
    // 404 (non-JSON body) means the router isn't actually serving.
    expect(
        response.status(),
        `Expected 404 from tRPC for unknown procedure, got ${response.status()}`
    ).toBe(404);

    expect(
        response.headers()['content-type'] ?? '',
        'tRPC responses must be JSON — non-JSON 404 indicates upstream is answering'
    ).toContain('application/json');

    const body = (await response.json()) as {
        error?: { code?: number; data?: { code?: string } };
    };

    // JSON-RPC error code -32004 + tRPC's NOT_FOUND is the unmistakable
    // signature of a live tRPC handler.
    expect(body.error?.code, 'missing JSON-RPC error code — not a tRPC response').toBe(-32004);
    expect(body.error?.data?.code, 'missing tRPC NOT_FOUND code — not a tRPC response').toBe(
        'NOT_FOUND'
    );
};

test.describe('Tier 1: API Health Checks', () => {
    test.describe('Brain Service (Network API)', () => {
        test('health endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${API_URL}/health-check`);
            expect(response.status()).toBe(200);
        });

        test('tRPC router is mounted and serving', async ({ request }) => {
            await expectTrpcReachable(request, BRAIN_ROOT);
        });

        test('did:web resolves at /.well-known/did.json', async ({ request }) => {
            const response = await request.get(`${BRAIN_ROOT}/.well-known/did.json`);
            expect(response.status()).toBe(200);
            const body = await response.json();
            expect(body.id, 'did.json must declare a did:web identifier').toMatch(/^did:web:/);
        });

        test('OpenAPI docs endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${BRAIN_ROOT}/docs`);
            expect(response.status()).toBe(200);
        });
    });

    test.describe('LearnCloud (Storage API)', () => {
        test('health endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${CLOUD_URL}/health-check`);
            expect(response.status()).toBe(200);
        });

        test('tRPC router is mounted and serving', async ({ request }) => {
            await expectTrpcReachable(request, CLOUD_ROOT);
        });
    });

    test.describe('LCA API', () => {
        test('health endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${LCA_API_URL}/health-check`);
            expect(response.status()).toBe(200);
        });

        test('tRPC router is mounted and serving', async ({ request }) => {
            await expectTrpcReachable(request, LCA_ROOT);
        });

        test('OpenAPI docs endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${LCA_ROOT}/docs`);
            expect(response.status()).toBe(200);
        });
    });
});
