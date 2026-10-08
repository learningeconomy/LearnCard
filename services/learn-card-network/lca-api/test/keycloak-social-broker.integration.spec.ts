import { createRequire } from 'node:module';
import type { Browser, Page, chromium as Chromium } from '@playwright/test';
import { decodeJwt } from 'jose';
import { z } from 'zod';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createKeycloakAdmin } from '../scripts/keycloak-admin';
import {
    callback,
    createBrokerAuthorization,
    exchangeBrokerCode,
    keycloakIssuer,
    roundtripEnabled,
    signInThroughBroker,
    trpc,
} from './helpers/keycloak-broker';

const idpSchema = z.object({
    trustEmail: z.boolean(),
    firstBrokerLoginFlowAlias: z.string(),
    config: z.record(z.string(), z.string()),
});
const isCallback = (url: URL): boolean => `${url.origin}${url.pathname}` === callback;
const callbacks = new WeakMap<Page, URL>();

// Same browser-form driver as infra/keycloak/qa/signin.ts, shared PKCE with the ticket tests.
// No traces/screenshots: Playwright errors can include authorization codes and action links.
// The original error is intentionally not attached as `cause`: it would carry the URLs.
const redactBrowserError = (error: unknown): Error => {
    const reason =
        error instanceof Error
            ? error.message.split('\n')[0]?.replace(/https?:\/\/\S+/g, '[redacted URL]')
            : 'unknown';
    return new Error(`Synthetic browser action failed: ${reason}`);
};

const browserAction = <T>(action: () => Promise<T>): Promise<T> =>
    action().catch((error: unknown): never => {
        throw redactBrowserError(error);
    });

describe.runIf(roundtripEnabled)('web social broker ownership policy', () => {
    let admin: Awaited<ReturnType<typeof createKeycloakAdmin>>;
    let browser: Browser;
    beforeAll(async () => {
        if (keycloakIssuer !== 'http://localhost:8081/realms/learncard')
            throw new Error('Fake social tests are loopback-only');
        admin = await createKeycloakAdmin();
        const require = createRequire(
            new URL('../../../../tests/smoketests/package.json', import.meta.url)
        );
        const { chromium } = require('@playwright/test') as { chromium: typeof Chromium };
        browser = await chromium.launch();
    });
    afterAll(async () => {
        await browser?.close();
    });

    const signIn = async (
        page: Page,
        username: string
    ): Promise<ReturnType<typeof createBrokerAuthorization>> => {
        const authorization = createBrokerAuthorization('fake-google');
        page.setDefaultTimeout(15_000);
        page.on('request', request => {
            const url = new URL(request.url());
            if (isCallback(url)) callbacks.set(page, url);
        });
        await browserAction(async () => {
            await page.route(isCallback, route =>
                route.fulfill({ status: 200, contentType: 'text/plain', body: 'Test callback' })
            );
            await page.goto(authorization.url.href);
            await page.locator('input[name="username"]').fill(username);
            await page.locator('input[name="password"]').fill('test-only-password');
            await page.locator('#kc-login').click();
            await page.waitForURL(url => !url.pathname.startsWith('/realms/fake-google/'));
        });
        return authorization;
    };

    const tokenFromPage = async (
        page: Page,
        auth: ReturnType<typeof createBrokerAuthorization>
    ): Promise<string> => {
        await expect.poll(() => callbacks.has(page), { timeout: 15_000 }).toBe(true);
        // Chromium may refuse the unused app port after a server-side redirect.
        // Capture the request rather than relying on the destination being served.
        const url = callbacks.get(page);
        if (!url) throw new Error('No authorization callback request');
        if (url.searchParams.get('state') !== auth.state || url.searchParams.has('error'))
            throw new Error('Invalid social callback state/result');
        const code = url.searchParams.get('code');
        if (!code) throw new Error('Social callback has no code');
        return exchangeBrokerCode(code, auth.verifier);
    };

    it('uses the same verified-claim and automatic linking policy for Google, Apple and the fake', async () => {
        const providers = await Promise.all(
            ['google', 'apple', 'fake-google'].map(async alias =>
                idpSchema.parse(
                    await (await admin.request(`/identity-provider/instances/${alias}`)).json()
                )
            )
        );
        for (const provider of providers) {
            expect(provider.trustEmail).toBe(true);
            expect(provider.firstBrokerLoginFlowAlias).toBe(
                providers[0]!.firstBrokerLoginFlowAlias
            );
            expect(provider.config).toMatchObject({
                filteredByClaim: 'true',
                claimFilterName: 'email_verified',
                claimFilterValue: '^true$',
            });
        }
        expect(providers[1]!.config.tokenExchangeAccountLinkingEnabled).toBe('false');
        const executions = z
            .array(z.object({ providerId: z.string().optional(), requirement: z.string() }))
            .parse(
                await (
                    await admin.request(
                        `/authentication/flows/${encodeURIComponent(providers[0]!.firstBrokerLoginFlowAlias)}/executions`
                    )
                ).json()
            );
        expect(executions).toContainEqual(
            expect.objectContaining({ providerId: 'idp-auto-link', requirement: 'ALTERNATIVE' })
        );
        expect(
            executions.some(
                e =>
                    ['idp-confirm-link', 'idp-detect-existing-broker-user'].includes(
                        e.providerId ?? ''
                    ) && e.requirement !== 'DISABLED'
            )
        ).toBe(false);
    });

    it('creates a verified new account via browser + PKCE that the live lca-api accepts', async () => {
        const email = 'alice@example.com';
        expect(await admin.findUsers(email)).toHaveLength(0);
        const context = await browser.newContext();
        try {
            const page = await context.newPage();
            const auth = await signIn(page, 'new-social');
            const idToken = await tokenFromPage(page, auth);
            expect(decodeJwt(idToken).email_verified).toBe(true);
            const { verifyKeycloakToken } = await import('../src/helpers/auth.helpers');
            expect(await verifyKeycloakToken(idToken)).toMatchObject({
                email,
                providerType: 'keycloak',
            });
            expect(
                await trpc('keys.getAuthShare', { authToken: idToken, providerType: 'keycloak' })
            ).toBeNull();
            const users = await admin.findUsers(email);
            expect(users).toHaveLength(1);
            expect(users[0]!.emailVerified).toBe(true);
            expect(await admin.links(users[0]!.id)).toContainEqual(
                expect.objectContaining({ identityProvider: 'fake-google' })
            );
            // A fresh ticket hop has no browser SSO cookies and must link the existing
            // web-social user rather than rendering an account confirmation page.
            expect(await admin.links(users[0]!.id)).not.toContainEqual(
                expect.objectContaining({ identityProvider: 'lca-api' })
            );
            const emailLogin = await signInThroughBroker(email);
            expect(decodeJwt(emailLogin.idToken).sub).toBe(users[0]!.id);
            expect(await admin.findUsers(email)).toHaveLength(1);
            expect(await admin.links(users[0]!.id)).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ identityProvider: 'fake-google' }),
                    expect.objectContaining({ identityProvider: 'lca-api' }),
                ])
            );
        } finally {
            await context.close();
            for (const user of await admin.findUsers(email))
                await admin.request(`/users/${user.id}`, { method: 'DELETE' });
        }
    }, 60_000);

    it('automatically links an existing passwordless account without an extra page', async () => {
        const email = 'existing-social@example.com';
        expect(await admin.findUsers(email)).toHaveLength(0);
        await admin.request('/users', {
            method: 'POST',
            body: JSON.stringify({
                username: 'r2-existing-passwordless',
                email,
                emailVerified: true,
                enabled: true,
            }),
        });
        const [existing] = await admin.findUsers(email);
        if (!existing) throw new Error('Missing collision fixture');
        const context = await browser.newContext();
        try {
            const page = await context.newPage();
            const auth = await signIn(page, 'existing-social');
            const idToken = await tokenFromPage(page, auth);
            expect(decodeJwt(idToken).sub).toBe(existing.id);
            expect(decodeJwt(idToken).email_verified).toBe(true);
            expect(await admin.links(existing.id)).toContainEqual(
                expect.objectContaining({ identityProvider: 'fake-google' })
            );
            expect(await admin.findUsers(email)).toHaveLength(1);
        } finally {
            await context.close();
            await admin.request(`/users/${existing.id}`, { method: 'DELETE' });
        }
    }, 60_000);

    it('rejects an explicitly unverified upstream email before creating or linking a user', async () => {
        const context = await browser.newContext();
        try {
            const page = await context.newPage();
            await signIn(page, 'unverified-social');
            expect(isCallback(new URL(page.url()))).toBe(false);
            expect(await page.locator('#kc-error-message').innerText()).toContain(
                'identity provider'
            );
            expect(await admin.findUsers('unverified-social@example.com')).toHaveLength(0);
        } finally {
            await context.close();
        }
    }, 60_000);
});
