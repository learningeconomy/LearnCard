import { expect, test } from '@playwright/test';

import { authenticateTestPage, BACKEND_URL } from '../auth';

test('loads topics with one ingestion request and one topic request', async ({ page, baseURL }) => {
    let ingestionRequests = 0;
    let topicRequests = 0;

    await authenticateTestPage(page, baseURL!);
    await page.route(`${BACKEND_URL}/credentials/ingestion`, async route => {
        ingestionRequests += 1;
        await route.fulfill({
            status: 202,
            contentType: 'application/json',
            body: JSON.stringify({ status: 'accepted', deduplicated: false }),
        });
    });
    await page.route(`${BACKEND_URL}/topics`, async route => {
        topicRequests += 1;
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ topics: ['Distributed Systems'] }),
        });
    });

    await page.goto('/topics');

    await expect(page.getByRole('link', { name: 'Distributed Systems' })).toBeVisible();
    expect(ingestionRequests).toBe(1);
    expect(topicRequests).toBe(1);
});
