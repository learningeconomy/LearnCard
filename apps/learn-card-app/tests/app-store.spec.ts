import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { MOCK_APP_LISTING, mockAppStoreRoutes } from './app-store.helpers';

test.describe('App Store', () => {
    test.beforeEach(async ({ page }) => {
        await mockAppStoreRoutes(page);
    });

    test('Browse app store and view app detail', async ({ page }) => {
        // 1. Navigate to LaunchPad
        await page.goto('/launchpad');

        // 2. Wait for app listing to appear
        await expect(page.getByText(MOCK_APP_LISTING.display_name).first()).toBeVisible({
            timeout: 30_000,
        });

        // 3. Verify the app's tagline is visible
        await expect(page.getByText(MOCK_APP_LISTING.tagline).first()).toBeVisible();

        // 4. Click "Get" to open the detail modal
        await page
            .locator('ion-item')
            .filter({ hasText: MOCK_APP_LISTING.display_name })
            .getByRole('button', { name: 'Get' })
            .click();

        // 5. Verify the detail modal opens with the app name and description
        await expect(page.getByText(MOCK_APP_LISTING.display_name)).toBeVisible({
            timeout: 10_000,
        });
        await expect(page.getByText('About')).toBeVisible();
        await expect(page.getByText(MOCK_APP_LISTING.full_description).first()).toBeVisible();
    });

    test('Install and launch embedded app', async ({ page }) => {
        // 1. Navigate to LaunchPad
        await page.goto('/launchpad');

        // 2. Wait for app listing to load
        await expect(page.getByText(MOCK_APP_LISTING.display_name).first()).toBeVisible({
            timeout: 30_000,
        });

        // 3. Click "Get" to open the detail modal
        await page
            .locator('ion-item')
            .filter({ hasText: MOCK_APP_LISTING.display_name })
            .getByRole('button', { name: 'Get' })
            .click();

        // 4. In the detail modal, click "Install"
        await expect(page.getByRole('button', { name: 'Install' })).toBeVisible({
            timeout: 10_000,
        });
        await page.getByRole('button', { name: 'Install' }).click();

        // 5. The AppInstallConsentModal should appear — our mock has no permissions
        //    so it shows "This app doesn't require any special permissions."
        //    Click "Install" to confirm
        await expect(page.getByText(/install.*\?/i)).toBeVisible({ timeout: 10_000 });
        await page.getByRole('button', { name: 'Install', exact: true }).last().click();

        // 6. After install, the button should change to "Open"
        await expect(page.getByRole('button', { name: 'Open' })).toBeVisible({ timeout: 30_000 });

        // 7. Click "Open" to launch the embedded app
        await page.getByRole('button', { name: 'Open' }).click();

        // 8. Verify the EmbedIframeModal opens with:
        //    - The app name in the toolbar
        //    - An iframe element that loads
        await expect(page.getByText(MOCK_APP_LISTING.display_name)).toBeVisible({
            timeout: 10_000,
        });
        await expect(page.locator('iframe')).toBeVisible({ timeout: 30_000 });
    });
});
