import { createRequire } from 'node:module';
import { createHash, randomBytes } from 'node:crypto';
import type { chromium as Chromium } from '@playwright/test';
import { required, secureUrl, record, requestJson } from './support';

/** Staging synthetic user only; no password grant or realm mutations. */
export const signIn = async (): Promise<void> => {
    if (required('ENV') !== 'staging') throw new Error('Sign-in driver is staging-only');
    const base = secureUrl(required('KEYCLOAK_BASE_URL'));
    const allowedHost = new URL(base).hostname;
    if (
        allowedHost !== 'auth.staging.learncard.app' &&
        allowedHost !== 'localhost' &&
        allowedHost !== '127.0.0.1'
    ) {
        throw new Error('Use staging or a TLS localhost tunnel to a staging restore');
    }
    const clientId = required('KEYCLOAK_CLIENT_ID');
    const username = required('KEYCLOAK_TEST_USER');
    const password = required('KEYCLOAK_TEST_PASSWORD');
    const callback = new URL(required('KEYCLOAK_REDIRECT_URI'));
    if (
        callback.search ||
        callback.hash ||
        callback.username ||
        callback.password ||
        (callback.protocol !== 'https:' &&
            !(
                callback.protocol === 'http:' &&
                ['localhost', '127.0.0.1'].includes(callback.hostname)
            ))
    ) {
        throw new Error('Use an approved HTTPS callback or localhost HTTP callback');
    }
    const realm = encodeURIComponent(process.env.KEYCLOAK_REALM ?? 'learncard');
    const verifier = randomBytes(32).toString('base64url');
    const state = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    const auth = new URL(`${base}/realms/${realm}/protocol/openid-connect/auth`);
    auth.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callback.href,
        response_type: 'code',
        scope: 'openid',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
    }).toString();
    // Resolve the already-declared smoketests dependency; do not add a root dependency.
    const require = createRequire(
        new URL('../../../tests/smoketests/package.json', import.meta.url)
    );
    const { chromium } = require('@playwright/test') as { chromium: typeof Chromium };
    const browser = await chromium.launch();
    try {
        const context = await browser.newContext({ serviceWorkers: 'block' });
        const page = await context.newPage();
        page.setDefaultTimeout(20000);
        await page.route(
            url => url.origin === callback.origin && url.pathname === callback.pathname,
            route =>
                route.fulfill({
                    status: 200,
                    contentType: 'text/plain',
                    body: 'Synthetic callback captured',
                })
        );
        await page.goto(auth.href);
        await page.locator('input[name="username"]').fill(username);
        await page.locator('input[name="password"]').fill(password);
        await Promise.all([
            page.waitForURL(
                url => url.origin === callback.origin && url.pathname === callback.pathname
            ),
            page.locator('#kc-login').click(),
        ]);
        const result = new URL(page.url());
        const code = result.searchParams.get('code');
        if (!code || result.searchParams.get('state') !== state || result.searchParams.has('error'))
            throw new Error('Invalid authorization callback');
        const tokens = record(
            await requestJson(`${base}/realms/${realm}/protocol/openid-connect/token`, {
                method: 'POST',
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: clientId,
                    code,
                    redirect_uri: callback.href,
                    code_verifier: verifier,
                }),
            })
        );
        if (typeof tokens.access_token !== 'string' || !tokens.access_token)
            throw new Error('No access token returned');
        // End the synthetic session; never emit tokens/cookies or browser traces.
        if (typeof tokens.refresh_token === 'string') {
            const logout = await fetch(`${base}/realms/${realm}/protocol/openid-connect/logout`, {
                method: 'POST',
                body: new URLSearchParams({
                    client_id: clientId,
                    refresh_token: tokens.refresh_token,
                }),
                redirect: 'error',
                signal: AbortSignal.timeout(20000),
            });
            if (!logout.ok)
                throw new Error(`Synthetic session cleanup failed: HTTP ${logout.status}`);
        }
        process.stdout.write('PASS authorization-code + PKCE S256 sign-in and session cleanup\n');
    } finally {
        await browser.close();
    }
};

if (import.meta.main) {
    signIn().catch((): void => {
        // Playwright errors may include callback URLs containing authorization codes.
        process.stderr.write(
            'FAIL synthetic sign-in; check configuration, login form and staging availability (details suppressed)\n'
        );
        process.exitCode = 1;
    });
}
