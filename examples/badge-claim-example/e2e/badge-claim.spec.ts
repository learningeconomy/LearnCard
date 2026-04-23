import { test, expect, Page } from '@playwright/test';

/**
 * Waits for the badge-claim.js widget to finish mounting (capture-url.js fills
 * in the generated URL or a QR fallback label) and returns whatever text it
 * displayed. The tests then assert on the specific URL shape.
 */
async function readGeneratedUrl(page: Page): Promise<string> {
    const el = page.getByTestId('generated-url');
    await expect(el).not.toHaveText('loading…', { timeout: 10_000 });
    return (await el.textContent())?.trim() ?? '';
}

test.describe('Badge Claim examples', () => {
    // host-switcher.js persists the selected target host in localStorage. Each
    // test gets a fresh browser context (and thus a fresh storage) by default,
    // but make the reset explicit so the default-host assertions below stay
    // stable even if someone tweaks the Playwright context config.
    test.beforeEach(async ({ context }) => {
        await context.clearCookies();
    });

    test('landing page links to every demo', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Badge Claim SDK — Examples' })).toBeVisible();

        for (const href of [
            './signed.html',
            './unsigned.html',
            './qr-only.html',
            './button-only.html',
            './custom-target.html',
        ]) {
            await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
        }
    });

    // Every demo now emits the same single-workflow URL shape; the server does
    // all URL-vs-JSON and signed-vs-unsigned detection. The SDK only ever
    // generates `/interactions/inline/<base64url(src)>?iuv=1`.

    test('signed.html builds an /interactions/inline/ URL with ?iuv=1', async ({ page }) => {
        await page.goto('/signed.html');

        // Both button + QR should render.
        await expect(page.locator('.lc-badge-claim__button')).toBeVisible();
        await expect(page.locator('.lc-badge-claim__qr img')).toBeVisible();

        const url = await readGeneratedUrl(page);
        expect(url).toContain('/interactions/inline/');
        expect(url).toMatch(/^https:\/\/learncard\.app\//);
        expect(url).toContain('?iuv=1');
    });

    test('unsigned.html also uses the same /interactions/inline/ URL (server auto-detects)', async ({ page }) => {
        await page.goto('/unsigned.html');

        await expect(page.locator('.lc-badge-claim__button')).toBeVisible();
        const url = await readGeneratedUrl(page);
        // Single workflow id regardless of whether the source JSON is signed.
        expect(url).toContain('/interactions/inline/');
        expect(url).toContain('?iuv=1');
    });

    test('qr-only.html renders a QR but no button, and exposes the URL on the widget', async ({ page }) => {
        await page.goto('/qr-only.html');

        await expect(page.locator('.lc-badge-claim__qr img')).toBeVisible();
        await expect(page.locator('.lc-badge-claim__button')).toHaveCount(0);

        const widget = page.locator('.lc-badge-claim');
        await expect(widget).toHaveAttribute('data-workflow-id', 'inline');

        const url = await readGeneratedUrl(page);
        expect(url).toContain('/interactions/inline/');
        expect(url).toContain('?iuv=1');
    });

    test('button-only.html renders a button but no QR, with custom label', async ({ page }) => {
        await page.goto('/button-only.html');

        const btn = page.locator('.lc-badge-claim__button');
        await expect(btn).toBeVisible();
        await expect(btn).toHaveText('Claim your badge');
        await expect(page.locator('.lc-badge-claim__qr')).toHaveCount(0);

        const url = await readGeneratedUrl(page);
        expect(url).toContain('/interactions/inline/');
        expect(url).toContain('?iuv=1');
    });

    test('custom-target.html mounts the widget inside #claim-here', async ({ page }) => {
        await page.goto('/custom-target.html');

        const widget = page.locator('#claim-here .lc-badge-claim');
        await expect(widget).toBeVisible();

        // Confirm there's exactly one widget on the page and it's inside the target.
        await expect(page.locator('.lc-badge-claim')).toHaveCount(1);
    });

    test.describe('host switcher', () => {
        test('defaults to Production (https://learncard.app)', async ({ page }) => {
            await page.goto('/signed.html');

            await expect(page.getByTestId('active-host')).toHaveText('https://learncard.app');

            const activeBtn = page.locator('.host-switcher__btn--active');
            await expect(activeBtn).toHaveText('Production');

            const url = await readGeneratedUrl(page);
            expect(url).toMatch(/^https:\/\/learncard\.app\//);
        });

        test('switching to Staging updates the generated URL host', async ({ page }) => {
            await page.goto('/signed.html');
            await readGeneratedUrl(page);

            await page.locator('.host-switcher__btn', { hasText: 'Staging' }).click();

            // Clicking reloads the page; wait for the widget to re-render.
            await expect(page.getByTestId('active-host')).toHaveText('https://staging.learncard.ai');

            const url = await readGeneratedUrl(page);
            expect(url).toMatch(/^https:\/\/staging\.learncard\.ai\//);
            expect(url).toContain('/interactions/inline/');
            expect(url).toContain('?iuv=1');
        });

        test('switching to VetPass updates the generated URL host', async ({ page }) => {
            await page.goto('/unsigned.html');

            await page.locator('.host-switcher__btn', { hasText: 'VetPass' }).click();
            await expect(page.getByTestId('active-host')).toHaveText('https://vetpass.app');

            const url = await readGeneratedUrl(page);
            expect(url).toMatch(/^https:\/\/vetpass\.app\//);
        });

        test('switching to Local points at http://localhost:8888 (Netlify dev)', async ({ page }) => {
            await page.goto('/unsigned.html');

            await page.locator('.host-switcher__btn', { hasText: 'Local' }).click();
            await expect(page.getByTestId('active-host')).toHaveText('http://localhost:8888');

            const url = await readGeneratedUrl(page);
            expect(url).toMatch(/^http:\/\/localhost:8888\//);
            expect(url).toContain('/interactions/inline/');
            expect(url).toContain('?iuv=1');
        });

        test('Local host swaps data-src to the data-src-local sidecar (local fixture)', async ({ page }) => {
            await page.goto('/signed.html');
            await readGeneratedUrl(page);

            // Production host → envelope contains the deployed public fixture URL.
            const decodeEnvelope = async () => {
                const url = await readGeneratedUrl(page);
                const payload = url.split('/').pop()!.split('?')[0]!;
                // base64url → base64 → JSON
                const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
                return JSON.parse(
                    await page.evaluate(b => atob(b + '='.repeat((4 - (b.length % 4)) % 4)), b64)
                ) as { v: number; url: string };
            };

            const prodEnvelope = await decodeEnvelope();
            expect(prodEnvelope.url).toBe(
                'https://learncard.app/demo-badges/accountability-signed.json'
            );

            // Switch to Local → host-switcher should swap in data-src-local. The SDK
            // then absolutizes against window.location (http://localhost:8899/...).
            await page.locator('.host-switcher__btn', { hasText: 'Local' }).click();
            await expect(page.getByTestId('active-host')).toHaveText('http://localhost:8888');

            const localEnvelope = await decodeEnvelope();
            expect(localEnvelope.url).toMatch(
                /^http:\/\/localhost:8899\/badges\/accountability-signed\.json$/
            );
        });

        test('selection persists across navigation via localStorage', async ({ page }) => {
            await page.goto('/signed.html');
            await page.locator('.host-switcher__btn', { hasText: 'Staging' }).click();
            await expect(page.getByTestId('active-host')).toHaveText('https://staging.learncard.ai');

            await page.goto('/unsigned.html');
            await expect(page.getByTestId('active-host')).toHaveText('https://staging.learncard.ai');
            const url = await readGeneratedUrl(page);
            expect(url).toMatch(/^https:\/\/staging\.learncard\.ai\//);
        });
    });

    test('base64url payload round-trips without + or / characters', async ({ page }) => {
        await page.goto('/signed.html');

        const url = await readGeneratedUrl(page);
        // Path looks like: /interactions/inline/<base64url>?iuv=1
        const payload = url.split('/').pop()?.split('?')[0] || '';
        // base64url replaces + / with - _ and strips = padding.
        expect(payload).not.toContain('+');
        expect(payload).not.toContain('/');
        expect(payload).not.toContain('=');
        expect(payload.length).toBeGreaterThan(10);
    });
});
