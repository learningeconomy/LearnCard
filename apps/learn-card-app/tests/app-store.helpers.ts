import { Page } from '@playwright/test';

export const MOCK_APP_LISTING = {
    listing_id: 'test-app-listing-001',
    slug: 'test-embed-app',
    display_name: 'Test Embed App',
    tagline: 'A test embedded application',
    full_description: 'This is a test embedded application used for Playwright E2E testing.',
    icon_url: 'https://placehold.co/100x100/4A90D9/ffffff?text=T',
    app_listing_status: 'LISTED',
    launch_type: 'EMBEDDED_IFRAME',
    launch_config_json: JSON.stringify({
        url: 'https://test-embed-app.example.com',
    }),
    category: 'Tools',
    promotion_level: 'STANDARD',
    highlights: ['Easy to use', 'Fast'],
    screenshots: [],
};

const MOCK_EMBED_HTML = `
<!DOCTYPE html>
<html>
<head><title>Test Embed App</title></head>
<body>
    <h1>Test Embed App Loaded</h1>
    <p>This is a test embedded application.</p>
</body>
</html>
`;

/**
 * Sets up route interception for app store tRPC endpoints.
 *
 * Mocks the following routes:
 * - browseListedApps: Returns the mock app listing
 * - getInstalledApps: Returns empty initially, includes the mock app after install
 * - isAppInstalled: Returns false initially, true after install
 * - installApp: Returns true (success)
 * - getPublicListing: Returns the mock app listing
 * - getListingInstallCount: Returns a count
 *
 * Also intercepts the embed URL to serve a simple HTML page.
 */
export const mockAppStoreRoutes = async (page: Page) => {
    let isInstalled = false;

    // Mock tRPC batch endpoint — tRPC batches all calls to a single URL
    // We need to intercept the batch and respond per-procedure
    await page.route('**/trpc/**appStore**', async (route, request) => {
        const url = new URL(request.url());
        const pathname = url.pathname;

        // tRPC uses query params for batched queries and POST body for mutations
        const method = request.method();

        // Handle individual procedure paths
        if (pathname.includes('appStore.browseListedApps')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    result: {
                        data: {
                            hasMore: false,
                            records: [MOCK_APP_LISTING],
                        },
                    },
                }),
            });
        } else if (pathname.includes('appStore.getInstalledApps')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    result: {
                        data: {
                            hasMore: false,
                            records: isInstalled
                                ? [{ ...MOCK_APP_LISTING, installed_at: new Date().toISOString() }]
                                : [],
                        },
                    },
                }),
            });
        } else if (pathname.includes('appStore.isAppInstalled')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    result: { data: isInstalled },
                }),
            });
        } else if (pathname.includes('appStore.installApp')) {
            isInstalled = true;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    result: { data: true },
                }),
            });
        } else if (pathname.includes('appStore.uninstallApp')) {
            isInstalled = false;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    result: { data: true },
                }),
            });
        } else if (pathname.includes('appStore.getPublicListing')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    result: { data: MOCK_APP_LISTING },
                }),
            });
        } else if (pathname.includes('appStore.getListingInstallCount')) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    result: { data: 42 },
                }),
            });
        } else {
            // Let other tRPC calls pass through
            await route.continue();
        }
    });

    // Serve mock HTML for the embedded app iframe
    await page.route('https://test-embed-app.example.com/**', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: MOCK_EMBED_HTML,
        });
    });
};
