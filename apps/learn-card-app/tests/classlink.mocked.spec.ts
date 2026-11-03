import { test, expect } from './fixtures/mocked-test';
import { installNetwork } from './mocks/network';

const SIGN_IN_WITH_CUSTOM_TOKEN =
    /identitytoolkit\.googleapis\.com\/v1\/accounts:signInWithCustomToken/;

test.describe('ClassLink callback handling @mocked', () => {
    test.beforeEach(async ({ page }) => {
        // MUST run before any navigation so boot calls are served.
        await installNetwork(page);
    });

    test('an unknown callback state redirects to /login with an expired message', async ({
        page,
    }) => {
        await page.goto('/auth/classlink/callback?code=test-code&state=unknown-state');

        await page.waitForURL(/\/login/);
        await expect(page.getByText(/expired/i)).toBeVisible();
    });

    test('error=access_denied redirects to /login with a cancelled message', async ({ page }) => {
        await page.goto('/auth/classlink/callback?error=access_denied');

        await page.waitForURL(/\/login/);
        await expect(page.getByText(/cancel/i)).toBeVisible();
    });
});

test.describe('ClassLink sign-in hand-off @mocked', () => {
    // fixme reason: the sign-in helpers call lca-api through a throwaway account
    // (initWallet('aaa')), and no mocked-tier test exercises that path yet: its lca-api
    // plugin boot batches utilities.getEncryptionKey with the ClassLink call and then
    // fails in DIDKit ("Key mismatch") against the recorded network. Hand-off is covered
    // by startClassLinkLogin unit tests and the lca-api router/curl checks instead.
    test.fixme('hands the exchanged code off to Firebase custom-token sign-in', async ({
        page,
    }) => {
        const mock = await installNetwork(page);

        // The local tenant config defaults `classlinkSso` to false; force it on for
        // this test only by patching the baked config response rather than every field.
        await page.route('**/tenant-config.json', async route => {
            const response = await route.fetch();
            const json = await response.json();
            await route.fulfill({
                status: response.status(),
                headers: response.headers(),
                contentType: 'application/json',
                body: JSON.stringify({
                    ...json,
                    features: { ...json.features, classlinkSso: true },
                }),
            });
        });

        let exchangeInput: { code?: string; codeVerifier?: string } = {};

        // `input.state`/`redirectUri` are generated client-side (PKCE) and sent to
        // the authorize-url call; echo them back so the callback's state check passes.
        mock.on('classlink.getAuthorizeUrl', raw => {
            const input = raw as { redirectUri: string; state: string };
            return {
                url: `${input.redirectUri}?code=stub-auth-code&state=${encodeURIComponent(
                    input.state
                )}`,
            };
        });
        mock.on('classlink.exchangeCode', raw => {
            exchangeInput = raw as { code: string; codeVerifier: string };
            return { token: 'stub-custom-token' };
        });

        // Simulate Firebase rejecting the custom token so the flow resolves without
        // a real Firebase project (see plan "Browser auth strategy").
        await page.route(SIGN_IN_WITH_CUSTOM_TOKEN, route =>
            route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: {
                        code: 400,
                        message: 'INVALID_CUSTOM_TOKEN',
                        status: 'INVALID_ARGUMENT',
                    },
                }),
            })
        );

        await page.goto('/login');
        const classlinkButton = page.getByTestId('social-login-classlink');
        await expect(classlinkButton).toBeVisible();

        const signInRequestPromise = page.waitForRequest(SIGN_IN_WITH_CUSTOM_TOKEN);

        await classlinkButton.click();

        const signInRequest = await signInRequestPromise;
        expect(signInRequest.postDataJSON()?.token).toBe('stub-custom-token');

        // The Firebase rejection sends the user back to /login with a friendly error.
        await page.waitForURL(/\/login/);

        expect(exchangeInput.code).toBe('stub-auth-code');
        expect(exchangeInput.codeVerifier?.length ?? 0).toBeGreaterThanOrEqual(43);
        expect(exchangeInput.codeVerifier?.length ?? 0).toBeLessThanOrEqual(128);
    });
});

test.describe('ClassLink signed-in states @mocked', () => {
    // The mocked tier has no signed-in boot for a ClassLink account, so the transcript
    // card and personal-email prompt states are covered by lca-api router tests, not here.
    test.fixme('transcript card states and personal email prompt (needs a ClassLink signed-in mocked boot)', async () =>
        undefined);
});
