import { test, expect } from '@playwright/test';

test.describe('Tier 2: Browser Smoke Checks', () => {
    test('app returns 200 and renders', async ({ page }) => {
        const response = await page.goto('/');
        expect(response?.status()).toBe(200);
        // Page should have content (not blank)
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('login page renders with sign-in elements', async ({ page }) => {
        await page.goto('/', { waitUntil: 'load' });
        // Wait for SPA mount before probing for login UI — `.count()` doesn't auto-wait.
        const loginElements = page.locator(
            'input[type="email"], input[placeholder*="email" i], input[name="email"], ' +
                'button:has-text("Sign"), button:has-text("Log in"), ' +
                'ion-button:has-text("Sign"), ion-button:has-text("Log")'
        );
        await expect(loginElements.first()).toBeVisible({ timeout: 15_000 });
    });

    test('no critical JS console errors on load', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        await page.goto('/', { waitUntil: 'load' });
        // Wait for the Ionic SPA shell to mount so we capture hydration errors too.
        // Don't use networkidle — real apps have WebSockets/analytics that never go idle.
        // Wait for any interactive element to paint — signals the SPA has hydrated.
        // Don't assert on #root/ion-app: they may carry visibility:hidden during splash.
        await expect(page.locator('button, input, a[href]').first()).toBeVisible({
            timeout: 15_000,
        });
        // Filter out known non-critical errors. The `critical assets load successfully`
        // test below specifically asserts JS/CSS/WASM didn't 404 — so generic resource
        // 404s logged here are non-critical (icons, manifest, images, analytics).
        const criticalErrors = errors.filter(
            e =>
                !e.includes('favicon') &&
                !e.includes('403') &&
                !e.includes('net::ERR_BLOCKED_BY_CLIENT') &&
                !e.includes('Failed to load resource')
        );
        expect(criticalErrors).toEqual([]);
    });

    test('critical assets load successfully', async ({ page }) => {
        const failedRequests: string[] = [];
        page.on('response', response => {
            const url = response.url();
            const status = response.status();
            // Track failed loads for JS/CSS/WASM assets
            if (
                (url.endsWith('.js') || url.endsWith('.css') || url.endsWith('.wasm')) &&
                status >= 400
            ) {
                failedRequests.push(`${status} ${url}`);
            }
        });
        await page.goto('/', { waitUntil: 'load' });
        // `load` fires after all <script>/<link> resources declared in HTML have loaded,
        // which is exactly what this test asserts — no need to wait for network silence.
        expect(failedRequests).toEqual([]);
    });

    test('deep links resolve to app (not 404)', async ({ page }) => {
        // These routes should return the SPA shell (200), not a server 404
        const routes = ['/wallet', '/connections'];
        for (const route of routes) {
            const response = await page.goto(route);
            expect(response?.status(), `Route ${route} should not 404`).not.toBe(404);
        }
    });

    test('API connectivity from frontend (no CORS errors)', async ({ page }) => {
        const corsErrors: string[] = [];
        page.on('console', msg => {
            const text = msg.text();
            if (
                text.toLowerCase().includes('cors') ||
                text.toLowerCase().includes('cross-origin')
            ) {
                corsErrors.push(text);
            }
        });
        await page.goto('/', { waitUntil: 'load' });
        // Give the SPA a short window to mount and fire its initial API calls.
        // Waiting on networkidle would hang forever — the app keeps WebSockets open.
        // Wait for any interactive element to paint — signals the SPA has hydrated.
        // Don't assert on #root/ion-app: they may carry visibility:hidden during splash.
        await expect(page.locator('button, input, a[href]').first()).toBeVisible({
            timeout: 15_000,
        });
        await page.waitForTimeout(2000);
        expect(corsErrors).toEqual([]);
    });
});
