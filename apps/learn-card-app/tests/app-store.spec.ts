import { expect } from '@playwright/test';
import { test } from './fixtures/test';
import { seedAppListing, mockEmbedRoute, SeededListing } from './app-store.helpers';
import { waitForAuthenticatedState } from './test.helpers';

test.describe('App Store — redirect flow', () => {
    let listing: SeededListing;

    test.beforeEach(async () => {
        listing = await seedAppListing();
    });

    test('shows install context toast on login page when redirected from app listing', async ({ page }) => {
        // Start logged out — no waitForAuthenticatedState
        await page.goto('/');

        // Navigate to app listing directly
        await page.goto(`/app/${listing.listingId}`);

        // Wait for listing page to load
        await expect(page.getByText(listing.displayName)).toBeVisible({ timeout: 20_000 });

        // Click "Get App" (button text for logged-out users) or "Install"
        // The button shows "Get App" when logged out
        await page.getByRole('button', { name: /get app|install/i }).click();

        // Should navigate to /login
        await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

        // Toast should show install context — "Sign in to install [displayName]"
        await expect(
            page.getByText(new RegExp(`Sign in to install ${listing.displayName}`, 'i'))
        ).toBeVisible({ timeout: 5_000 });
    });

    test('auto-triggers install modal after login redirect (existing user)', async ({ page }) => {
        // Seed a user with a profile BEFORE logging in, so they have an existing account
        await waitForAuthenticatedState(page, { profileId: 'testa' });

        // Log out by clearing localStorage and reloading
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Navigate to app listing (logged out now)
        await page.goto(`/app/${listing.listingId}`);

        // Wait for listing to load
        await expect(page.getByText(listing.displayName)).toBeVisible({ timeout: 20_000 });

        // Click "Get App" to trigger install intent + redirect
        await page.getByRole('button', { name: /get app|install/i }).click();

        // Should redirect to /login
        await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });

        // Log in again — waitForAuthenticatedState handles the login flow
        // The returnUrl in the URL should cause redirect back to /app/:id
        await waitForAuthenticatedState(page, { profileId: 'testa' });

        // Should land back on the app listing
        await expect(page).toHaveURL(new RegExp(`/app/${listing.listingId}`), { timeout: 15_000 });

        // Install consent modal should auto-open
        await expect(page.getByText(/install.*\?/i)).toBeVisible({ timeout: 20_000 });
    });
});

test.describe('App Store', () => {
    let listing: SeededListing;

    test.beforeEach(async ({ page }) => {
        // Seed Neo4j listing BEFORE auth so the app's initial queries pick it up
        listing = await seedAppListing();

        // Login and create a network profile in one step — the seed route calls
        // wallet.invoke.createProfile() which guarantees DID consistency
        await waitForAuthenticatedState(page, { profileId: 'testa' });

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
        const modal = page.locator('#right-modal');
        await expect(modal.getByText(listing.displayName)).toBeVisible({
            timeout: 10_000,
        });
        await expect(modal.getByText('About')).toBeVisible();
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

        // Scope assertions to the detail modal to avoid strict mode violations
        // (the app name and buttons also appear in the list item behind the modal)
        const modal = page.locator('#right-modal');

        // 4. In the detail modal, click "Install"
        await expect(modal.getByRole('button', { name: 'Install' })).toBeVisible({
            timeout: 10_000,
        });
        await modal.getByRole('button', { name: 'Install' }).click();

        // 5. The AppInstallConsentModal should appear — click "Install" to confirm
        await expect(page.getByText(/install.*\?/i)).toBeVisible({ timeout: 10_000 });
        await page.getByRole('button', { name: 'Install', exact: true }).last().click();

        // 6. Wait for consent modal to close before checking install state
        await expect(page.getByText(/install.*\?/i)).not.toBeVisible({ timeout: 10_000 });

        // 7. After install + query refetch, the button should change to "Open"
        await expect(modal.getByRole('button', { name: 'Open' })).toBeVisible({ timeout: 60_000 });

        // 8. Click "Open" to launch the embedded app
        await modal.getByRole('button', { name: 'Open' }).click();

        // 9. Verify the EmbedIframeModal opens with an iframe
        await expect(page.getByText(listing.displayName).first()).toBeVisible({
            timeout: 10_000,
        });
        await expect(page.locator(`iframe[title*="${listing.displayName}"]`)).toBeVisible({ timeout: 30_000 });
    });
});
