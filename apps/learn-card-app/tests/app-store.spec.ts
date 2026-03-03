import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import {
    seedAppListing,
    ensureTestProfile,
    mockEmbedRoute,
    SeededListing,
} from './app-store.helpers';
import { waitForAuthenticatedState } from './test.helpers';

test.describe('App Store', () => {
    let listing: SeededListing;

    test.beforeEach(async ({ page }) => {
        // Seed Neo4j data BEFORE auth so the app's initial queries pick it up
        listing = await seedAppListing();
        await ensureTestProfile('testa');

        await waitForAuthenticatedState(page);

        // Mock only the embed URL — everything else is real
        await mockEmbedRoute(page);
    });

    test('Browse app store and view app detail', async ({ page }) => {
        // 1. Navigate to LaunchPad
        await page.goto('/launchpad');

        // 2. Wait for the seeded app listing to appear
        await expect(page.getByText(listing.displayName).first()).toBeVisible({
            timeout: 30_000,
        });

        // 3. Click "Get" to open the detail modal
        await page
            .locator('ion-item')
            .filter({ hasText: listing.displayName })
            .getByRole('button', { name: 'Get' })
            .click();

        // 4. Verify the detail modal opens with the app name and description
        await expect(page.getByText(listing.displayName)).toBeVisible({
            timeout: 10_000,
        });
        await expect(page.getByText('About')).toBeVisible();
    });

    test('Install and launch embedded app', async ({ page }) => {
        // 1. Navigate to LaunchPad
        await page.goto('/launchpad');

        // 2. Wait for the seeded listing to appear
        await expect(page.getByText(listing.displayName).first()).toBeVisible({
            timeout: 30_000,
        });

        // 3. Click "Get" to open the detail modal
        await page
            .locator('ion-item')
            .filter({ hasText: listing.displayName })
            .getByRole('button', { name: 'Get' })
            .click();

        // 4. In the detail modal, click "Install"
        await expect(page.getByRole('button', { name: 'Install' })).toBeVisible({
            timeout: 10_000,
        });
        await page.getByRole('button', { name: 'Install' }).click();

        // 5. The AppInstallConsentModal should appear — click "Install" to confirm
        await expect(page.getByText(/install.*\?/i)).toBeVisible({ timeout: 10_000 });
        await page.getByRole('button', { name: 'Install', exact: true }).last().click();

        // 6. After install, the button should change to "Open"
        await expect(page.getByRole('button', { name: 'Open' })).toBeVisible({ timeout: 30_000 });

        // 7. Click "Open" to launch the embedded app
        await page.getByRole('button', { name: 'Open' }).click();

        // 8. Verify the EmbedIframeModal opens with an iframe
        await expect(page.getByText(listing.displayName)).toBeVisible({
            timeout: 10_000,
        });
        await expect(page.locator('iframe')).toBeVisible({ timeout: 30_000 });
    });
});
