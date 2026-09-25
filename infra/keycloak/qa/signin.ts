/**
 * Playwright-based sign-in test for Keycloak staging.
 * Uses authorization-code flow with PKCE.
 * Staging-only: requires KEYCLOAK_STAGING_REALM_LIVE env var.
 *
 * Usage:
 *   KEYCLOAK_STAGING_REALM_LIVE=true \
 *   KEYCLOAK_TEST_USER=testuser \
 *   KEYCLOAK_TEST_PASSWORD=testpass \
 *   bunx playwright test infra/keycloak/qa/signin.ts
 */

import { test, expect, chromium } from '@playwright/test';

const host = process.env.HOST || 'auth.staging.learncard.app';
const protocol = 'https';
const baseUrl = `${protocol}://${host}`;
const realm = 'learncard';
const clientId = 'learncard-app';
const redirectUri = 'http://localhost:3000/callback';

// Staging-only guard
test.beforeAll((): void => {
    if (process.env.KEYCLOAK_STAGING_REALM_LIVE !== 'true') {
        throw new Error(
            'KEYCLOAK_STAGING_REALM_LIVE must be set to "true" to run staging sign-in tests'
        );
    }
});

test('authorization-code PKCE flow', async (): Promise<void> => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        // Step 1: Generate PKCE challenge
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // Step 2: Redirect to authorization endpoint
        const authUrl = new URL(`${baseUrl}/realms/${realm}/protocol/openid-connect/auth`);
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'openid profile email');
        authUrl.searchParams.set('code_challenge', codeChallenge);
        authUrl.searchParams.set('code_challenge_method', 'S256');

        await page.goto(authUrl.toString());

        // Step 3: Fill login form
        const testUser = process.env.KEYCLOAK_TEST_USER || 'testuser';
        const testPassword = process.env.KEYCLOAK_TEST_PASSWORD || 'testpass';

        await page.fill('input[name="username"]', testUser);
        await page.fill('input[name="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Step 4: Wait for redirect with authorization code
        await page.waitForURL(/code=/, { timeout: 10000 });
        const redirectUrl = page.url();
        const url = new URL(redirectUrl);
        const code = url.searchParams.get('code');

        expect(code).toBeTruthy();

        // Step 5: Exchange code for token
        const tokenUrl = `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
        const tokenResponse = await page.request.post(tokenUrl, {
            data: {
                grant_type: 'authorization_code',
                client_id: clientId,
                code: code!,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier,
            },
        });

        expect(tokenResponse.status()).toBe(200);
        const tokenData = (await tokenResponse.json()) as {
            access_token: string;
            token_type: string;
        };
        expect(tokenData.access_token).toBeTruthy();
        expect(tokenData.token_type).toBe('Bearer');
    } finally {
        await context.close();
        await browser.close();
    }
});

/**
 * Generate a random code verifier for PKCE.
 */
function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...Array.from(array)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generate code challenge from verifier (S256).
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...Array.from(new Uint8Array(hash))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
