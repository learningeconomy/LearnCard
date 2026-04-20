import { test, expect } from '@playwright/test';
import { resolveUrls } from '../lib/resolveUrls';

const { api: API_URL, cloud: CLOUD_URL, lcaApi: LCA_API_URL } = resolveUrls();

// DID / docs live at the service root, not under /api. Strip the suffix once.
const stripApi = (u: string) => u.replace(/\/api\/?$/, '');
const BRAIN_ROOT = stripApi(API_URL);
const CLOUD_ROOT = stripApi(CLOUD_URL);
const LCA_ROOT = stripApi(LCA_API_URL);

// A GET to the tRPC base should return something other than 502/503.
// 404 is fine — it means the service is up and routing, just that GET isn't
// the right verb for that path.
const expectReachable = (status: number) => {
    expect(status).not.toBe(502);
    expect(status).not.toBe(503);
};

test.describe('Tier 1: API Health Checks', () => {
    test.describe('Brain Service (Network API)', () => {
        test('health endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${API_URL}/health-check`);
            expect(response.status()).toBe(200);
        });

        test('tRPC endpoint is reachable', async ({ request }) => {
            const response = await request.get(`${API_URL}/trpc`);
            expectReachable(response.status());
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

        test('tRPC endpoint is reachable', async ({ request }) => {
            const response = await request.get(`${CLOUD_URL}/trpc`);
            expectReachable(response.status());
        });
    });

    test.describe('LCA API', () => {
        test('health endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${LCA_API_URL}/health-check`);
            expect(response.status()).toBe(200);
        });

        test('tRPC endpoint is reachable', async ({ request }) => {
            const response = await request.get(`${LCA_API_URL}/trpc`);
            expectReachable(response.status());
        });

        test('OpenAPI docs endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${LCA_ROOT}/docs`);
            expect(response.status()).toBe(200);
        });
    });
});
