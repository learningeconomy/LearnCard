import { test, expect } from '@playwright/test';

test.describe('Tier 2: Browser Smoke Checks', () => {
    test('app returns 200 and renders', async ({ page }) => {
        const response = await page.goto('/');
        expect(response?.status()).toBe(200);
        // Page should have content (not blank)
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('login page renders with sign-in elements', async ({ page }) => {
        await page.goto('/');
        // The app should show some form of login/sign-in UI
        // Look for email input or sign-in button
        const emailInput = page.locator(
            'input[type="email"], input[placeholder*="email" i], input[name="email"]'
        );
        const signInButton = page.locator(
            'button:has-text("Sign"), button:has-text("Log in"), ion-button:has-text("Sign"), ion-button:has-text("Log")'
        );
        // At least one login-related element should be visible
        const hasEmail = await emailInput.count();
        const hasSignIn = await signInButton.count();
        expect(hasEmail + hasSignIn).toBeGreaterThan(0);
    });

    test('no critical JS console errors on load', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        // Filter out known non-critical errors (e.g., favicon 404, third-party scripts)
        const criticalErrors = errors.filter(
            e =>
                !e.includes('favicon') &&
                !e.includes('403') &&
                !e.includes('net::ERR_BLOCKED_BY_CLIENT')
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
        await page.goto('/');
        await page.waitForLoadState('networkidle');
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
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        expect(corsErrors).toEqual([]);
    });
});
