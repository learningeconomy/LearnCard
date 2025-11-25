import { Page } from '@playwright/test';

export const mockLaunchDarkly = async (
    page: Page,
    testFlags: { [key: string]: { value: any } }
) => {
    await page.route(/.*\.launchdarkly\..*/, route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(testFlags),
        });
    });
};
