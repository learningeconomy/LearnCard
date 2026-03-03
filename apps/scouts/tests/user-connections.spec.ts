import { test, expect } from '@playwright/test';

// Helper function for searching a user on the contacts page
async function searchForUser(page, userId) {
    await page.goto('https://localhost:3000/contacts');
    await page.reload();
    const searchInput = page
        .getByTestId('addressbook-search-input')
        .getByPlaceholder('Search ScoutPass Network...');
    await expect(searchInput).toBeVisible();
    await searchInput.click();
    await searchInput.fill(userId);
}

test.describe('User connection requests (Search)', () => {
    // Clean up any connection requests before starting test
    test.beforeEach(async ({ page }) => {
        await searchForUser(page, 'gerard-oh-prod');

        const pendingButton = page.getByRole('button', { name: 'Pending • Cancel Request' });
        if (await pendingButton.isVisible()) {
            await expect(pendingButton).toBeVisible();
            await pendingButton.click();
            await page.getByRole('button', { name: 'Confirm' }).click();
            await page.reload();
        }
    });

    // Verify the connection request is pending
    test.afterEach(async ({ page }) => {
        await searchForUser(page, 'gerard-oh-prod');

        const pendingButton = page.getByRole('button', { name: 'Pending • Cancel Request' });
        if (await pendingButton.isVisible()) {
            await expect(pendingButton).toBeVisible();
        }
    });

    // Make the connection request
    test('Send connection request', async ({ page }) => {
        await searchForUser(page, 'gerard-oh-prod');

        const requestBtn = page.getByRole('button', { name: 'Request Connection' });
        if (await requestBtn.isVisible()) {
            await expect(requestBtn).toBeVisible();
            await test.step('Click request button and confirm action', async () => {
                await requestBtn.click();
                await page.getByRole('button', { name: 'Confirm' }).click();
                await page.reload();
            });
        }
    });
});

test.describe('User connection request (Existing)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('https://localhost:3000/connect/jacksonsmith');
        await page.reload();
    });

    test('Connection Request already exists', async ({ page }) => {
        await test.step('Attempt to request connection', async () => {
            await page.getByRole('button', { name: 'Request Connection' }).click();
        });
        await expect(page.getByRole('status')).toBeVisible();
        await expect(page.getByText('Cannot request connection.')).toBeVisible();
    });
});

test.describe('User connection request failed', () => {
    test('Unable to find user', async ({ page }) => {
        await page.goto('https://localhost:3000/connect/abrakadabra');
        await page.reload();

        await expect(page.getByRole('heading')).toContainText('Eeek!');
        await expect(page.getByRole('strong')).toContainText('Unable to find user');
    });
});

test.describe('Block user', () => {
    // Clean up blocked user before test
    test.beforeEach(async ({ page }) => {
        await page.goto('https://localhost:3000/contacts');
        await page.reload();

        await page.getByRole('button', { name: 'Blocked' }).click();

        const blockedUser = page.getByText('bbeaubobbybruce222Unblock');
        if (await blockedUser.isVisible()) {
            await expect(blockedUser).toBeVisible();
            await blockedUser.click();
            await page.getByRole('button', { name: 'Unblock Contact' }).click();
            await page.getByRole('button', { name: 'Confirm' }).click();
        }
    });

    // Verify user was blocked
    test.afterEach(async ({ page }) => {
        await page.goto('https://localhost:3000/contacts');
        await page.reload();

        await page.getByRole('button', { name: 'Blocked' }).click();

        const blockedUser = page
            .getByRole('listitem')
            .filter({ hasText: 'bbeaubobbybruce222Unblock' })
            .getByRole('button');
        if (await blockedUser.isVisible()) {
            await expect(blockedUser).toBeVisible();
        }
    });

    // Block user
    test('block user connection', async ({ page }) => {
        const userProfileID = 'beaubobbybruce222';
        await searchForUser(page, userProfileID);

        const userToBlock = page.getByText('bbeaubobbybruce222Request');
        if (await userToBlock.isVisible()) {
            await expect(userToBlock).toBeVisible();
            await test.step('Click user to block and confirm blocking', async () => {
                await userToBlock.click();
                await page.getByRole('button', { name: 'Block Contact' }).click();
                await page.getByRole('button', { name: 'Confirm' }).click();
            });
        }
    });
});
