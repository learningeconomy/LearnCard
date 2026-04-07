import { test, expect } from '@playwright/test';

// URLs from environment — playwright.config.ts sets baseURL to API_URL for api project
const API_URL = process.env.SMOKETEST_API_URL ?? 'http://localhost:3100';
const CLOUD_URL = process.env.SMOKETEST_CLOUD_URL ?? 'http://localhost:3200';
const LCA_API_URL = process.env.SMOKETEST_LCA_API_URL ?? 'http://localhost:3300';

test.describe('Tier 1: API Health Checks', () => {
    test.describe('Brain Service (Network API)', () => {
        test('health endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${API_URL}/health-check`);
            expect(response.status()).toBe(200);
        });

        test('tRPC endpoint is reachable', async ({ request }) => {
            // A GET to the tRPC base should return something other than 502/503
            const response = await request.get(`${API_URL}/trpc`);
            expect(response.status()).not.toBe(502);
            expect(response.status()).not.toBe(503);
        });
    });

    test.describe('LearnCloud (Storage API)', () => {
        test('health endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${CLOUD_URL}/health-check`);
            expect(response.status()).toBe(200);
        });
    });

    test.describe('LCA API', () => {
        test('health endpoint returns 200', async ({ request }) => {
            const response = await request.get(`${LCA_API_URL}/health-check`);
            expect(response.status()).toBe(200);
        });
    });
});
