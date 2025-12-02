import { expect } from '@playwright/test';
import { test } from './fixtures/test';

test.describe('CHAPI', () => {
    test('Connect Handler Information is visible', async ({ page }) => {
        await page.goto('/wallet');

        await page
            .locator('div')
            .filter({ hasText: /^Connect Handler$/ })
            .getByRole('button')
            .click();

        await expect(page.getByText(/about chapi/i)).toBeVisible();
    });
});
