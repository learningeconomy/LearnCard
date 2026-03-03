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
 * Handles both individual and batched tRPC requests. tRPC v10 batches
 * multiple calls into a single HTTP request with comma-separated procedure
 * names in the URL path and expects an array of responses.
 *
 * Also intercepts the embed URL to serve a simple HTML page.
 */
export const mockAppStoreRoutes = async (page: Page) => {
    let isInstalled = false;

    /** Returns a mock response for a single tRPC procedure */
    const getResponseForProcedure = (procedure: string): object | null => {
        if (procedure.includes('browseListedApps') || procedure.includes('browseAppStore')) {
            return {
                result: {
                    data: {
                        hasMore: false,
                        records: [MOCK_APP_LISTING],
                    },
                },
            };
        }
        if (procedure.includes('getInstalledApps')) {
            return {
                result: {
                    data: {
                        hasMore: false,
                        records: isInstalled
                            ? [{ ...MOCK_APP_LISTING, installed_at: new Date().toISOString() }]
                            : [],
                    },
                },
            };
        }
        if (procedure.includes('isAppInstalled')) {
            return { result: { data: isInstalled } };
        }
        if (procedure.includes('installApp')) {
            isInstalled = true;
            return { result: { data: true } };
        }
        if (procedure.includes('uninstallApp')) {
            isInstalled = false;
            return { result: { data: true } };
        }
        if (procedure.includes('getPublicListing') || procedure.includes('getPublicAppStoreListing')) {
            return { result: { data: MOCK_APP_LISTING } };
        }
        if (procedure.includes('getListingInstallCount') || procedure.includes('getAppStoreListingInstallCount')) {
            return { result: { data: 42 } };
        }
        return null;
    };

    await page.route('**/trpc/**appStore**', async (route, request) => {
        const url = new URL(request.url());
        const pathname = url.pathname;

        // Extract the procedure portion from the pathname (after /trpc/)
        const trpcPath = pathname.split('/trpc/').pop() ?? '';
        const procedures = trpcPath.split(',');
        const isBatch = url.searchParams.has('batch') || procedures.length > 1;

        if (isBatch) {
            // Build a response for each procedure in the batch
            const responses = procedures.map(proc => {
                const response = getResponseForProcedure(proc);
                // For procedures we don't mock, return a null/error placeholder
                // This shouldn't happen if our glob only matches appStore routes
                return response ?? { result: { data: null } };
            });

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(responses),
            });
        } else {
            // Single (non-batched) request
            const response = getResponseForProcedure(trpcPath);

            if (response) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(response),
                });
            } else {
                await route.continue();
            }
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
