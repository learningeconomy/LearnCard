import { Page } from '@playwright/test';
import neo4j from 'neo4j-driver';
import { randomUUID } from 'crypto';

const NEO4J_URI = 'bolt://localhost:7687';
const NEO4J_USER = 'neo4j';
const NEO4J_PASSWORD = 'this-is-the-password';

const EMBED_URL = 'https://test-embed-app.example.com';

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

export interface SeededListing {
    listingId: string;
    displayName: string;
}

/**
 * Seeds an app store listing directly in Neo4j with LISTED status.
 * Uses CURATED_LIST promotion level so it appears in the default LaunchPad view
 * (non-promoted STANDARD apps only show when the user is searching).
 */
export const seedAppListing = async (): Promise<SeededListing> => {
    const listingId = randomUUID();
    const displayName = `Test Embed App ${Date.now()}`;
    const slug = `test-embed-app-${Date.now()}`;

    console.log(`[seedAppListing] Connecting to Neo4j at ${NEO4J_URI}...`);
    const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    const session = driver.session();

    try {
        await session.run(
            `
            CREATE (i:Integration {id: $integrationId, name: 'Playwright Test Integration'})
            CREATE (l:AppStoreListing {
                listing_id: $listingId,
                display_name: $displayName,
                tagline: 'A test embedded application',
                full_description: 'This is a test embedded application used for Playwright E2E testing.',
                icon_url: 'https://example.com/icon.png',
                app_listing_status: 'LISTED',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: $launchConfigJson,
                category: 'tools',
                slug: $slug,
                promotion_level: 'CURATED_LIST',
                highlights_json: $highlightsJson,
                screenshots_json: '[]'
            })
            CREATE (i)-[:PUBLISHES_LISTING]->(l)
            `,
            {
                integrationId: randomUUID(),
                listingId,
                displayName,
                slug,
                launchConfigJson: JSON.stringify({ url: EMBED_URL }),
                highlightsJson: JSON.stringify(['Easy to use', 'Fast']),
            }
        );
        console.log(`[seedAppListing] Created listing: ${displayName} (${listingId})`);
    } finally {
        await session.close();
        await driver.close();
    }

    return { listingId, displayName };
};

/**
 * Intercepts the embed URL so the iframe loads a simple test page
 * instead of making a real network request.
 */
export const mockEmbedRoute = async (page: Page) => {
    await page.route(`${EMBED_URL}/**`, async route => {
        await route.fulfill({
            status: 200,
            contentType: 'text/html',
            body: MOCK_EMBED_HTML,
        });
    });
};
