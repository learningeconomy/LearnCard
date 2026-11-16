import { expect, test } from './fixtures/mocked-test';
import { TEST_USER_PROFILE_ID } from './constants';
import { installNetwork } from './mocks/network';
import type { BrainOutputs } from './mocks/trpc';
import { waitForAuthenticatedState } from './test.helpers';

const listings = ['Example Learning', 'Example Tools'].map((name, index) => ({
    listing_id: `layout-test-${index}`,
    display_name: name,
    tagline: 'An app for learning',
    full_description: 'A test app for the browse page.',
    icon_url: '/assets/icon/circle-orange-book.svg',
    app_listing_status: 'LISTED' as const,
    launch_type: 'EMBEDDED_IFRAME' as const,
    launch_config_json: JSON.stringify({ url: 'https://example.com' }),
    promotion_level: 'CURATED_LIST' as const,
}));

test.describe('Apps browse layout @mocked', () => {
    for (const viewport of [
        { name: 'desktop', width: 1280, height: 900 },
        { name: 'mobile', width: 390, height: 844 },
    ]) {
        test(`keeps search and app cards readable on ${viewport.name}`, async ({
            page,
        }, testInfo) => {
            await page.setViewportSize({ width: viewport.width, height: viewport.height });
            const mock = await installNetwork(page);
            mock.on('appStore.browseListedApps', input => {
                const promotion = (input as { promotionLevel?: string })?.promotionLevel;
                return {
                    records: promotion ? [] : listings,
                    hasMore: false,
                } satisfies BrainOutputs['appStore']['browseListedApps'];
            });
            mock.on(
                'appStore.getInstalledApps',
                () =>
                    ({
                        records: [],
                        hasMore: false,
                    }) satisfies BrainOutputs['appStore']['getInstalledApps']
            );

            await waitForAuthenticatedState(page, {
                path: '/launchpad',
                nextPath: '/launchpad',
                waitUntil: 'commit',
                profileId: TEST_USER_PROFILE_ID,
            });
            await page.getByRole('button', { name: /Browse More/ }).click();
            await expect(page).toHaveURL(/\/launchpad\/browse\?tab=All$/);

            const search = page.locator('input[placeholder="Search apps..."]');
            await expect(search).toBeVisible();
            // Text inputs avoid WebKit's native search-cancel event path while
            // retaining search semantics and the mobile keyboard action.
            await expect(search).toHaveAttribute('type', 'text');
            await expect(search).toHaveAttribute('role', 'searchbox');
            const icon = search
                .locator('xpath=ancestor::div[.//*[local-name()="svg"]][1]')
                .locator('svg');
            const inputGeometry = await search.evaluate(element => {
                const rect = element.getBoundingClientRect();
                const style = getComputedStyle(element);
                return { left: rect.left, paddingLeft: parseFloat(style.paddingLeft) };
            });
            const iconBox = await icon.boundingBox();
            expect(iconBox).not.toBeNull();
            expect(inputGeometry.left + inputGeometry.paddingLeft).toBeGreaterThanOrEqual(
                iconBox!.x + iconBox!.width + 4
            );

            const list = page.getByText('All Apps', { exact: true }).locator('../..');
            await expect(list.locator('ion-skeleton-text')).toHaveCount(0, { timeout: 30_000 });
            await expect(list).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
            const firstCard = list.locator(':scope > *').filter({ hasText: 'Example Learning' });
            const secondCard = list.locator(':scope > *').filter({ hasText: 'Example Tools' });
            await expect(firstCard).toBeVisible({ timeout: 30_000 });
            await expect(secondCard).toBeVisible();
            await expect(firstCard).toHaveCSS('background-color', 'rgb(255, 255, 255)');
            const [firstBox, secondBox] = await Promise.all([
                firstCard.boundingBox(),
                secondCard.boundingBox(),
            ]);
            expect(firstBox).not.toBeNull();
            expect(secondBox).not.toBeNull();
            expect(secondBox!.y).toBeGreaterThan(firstBox!.y + firstBox!.height);

            const developerCard = page.getByRole('button', { name: /Build Your Own App/ });
            const developerBox = await developerCard.boundingBox();
            expect(developerBox).not.toBeNull();
            expect(developerBox!.x).toBeCloseTo(firstBox!.x, 0);
            expect(developerBox!.width).toBeCloseTo(firstBox!.width, 0);
            expect(developerBox!.x).toBeGreaterThanOrEqual(16);
            expect(viewport.width - developerBox!.x - developerBox!.width).toBeGreaterThanOrEqual(
                16
            );

            const listingIcon = await firstCard.locator('img').boundingBox();
            const developerIcon = await developerCard.locator('.shrink-0').first().boundingBox();
            expect(listingIcon).not.toBeNull();
            expect(developerIcon).not.toBeNull();
            expect(developerIcon!.x - developerBox!.x).toBeCloseTo(listingIcon!.x - firstBox!.x, 0);
            const listingPadding = await firstCard.evaluate(element => {
                const style = getComputedStyle(element);
                return [parseFloat(style.paddingTop), parseFloat(style.paddingBottom)];
            });
            const developerPadding = await developerCard.evaluate(element => {
                const shell = getComputedStyle(element);
                const content = getComputedStyle(element.firstElementChild!);
                return [
                    parseFloat(shell.paddingTop) + parseFloat(content.paddingTop),
                    parseFloat(shell.paddingBottom) + parseFloat(content.paddingBottom),
                ];
            });
            expect(developerPadding).toEqual(listingPadding);
            const activePage = search.locator('xpath=ancestor::*[contains(@class, "ion-page")][1]');
            await expect(activePage).not.toHaveClass(/ion-page-invisible|ion-page-hidden/);
            await expect(activePage).toHaveCSS('opacity', '1');
            await expect(developerCard).toBeInViewport({ ratio: 1 });
            await firstCard.locator('img').evaluate(image => (image as HTMLImageElement).decode());
            await secondCard.locator('img').evaluate(image => (image as HTMLImageElement).decode());
            await page.screenshot({
                path: testInfo.outputPath(`apps-browse-${viewport.name}.png`),
                fullPage: false,
            });

            await search.fill('Example Learning');
            await expect(page.getByText('Example Learning', { exact: true })).toBeVisible();
            await expect(page.getByText('Example Tools', { exact: true })).toHaveCount(0);
            const results = page.getByText('1 Search Result', { exact: true }).locator('../..');
            await expect(results).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
            await search.fill('');
            await expect(search).toHaveValue('');
            await expect(page.getByText('All Apps', { exact: true })).toBeVisible();
            await expect(page.getByText('Example Learning', { exact: true })).toBeVisible();
            await expect(page.getByText('Example Tools', { exact: true })).toBeVisible();
        });
    }
});
