#!/usr/bin/env tsx
/**
 * Seed a dev partner app into the local brain-service database.
 *
 * Prerequisites:
 *   - Neo4j + Redis running (e.g. `pnpm dev:services` from apps/learn-card-app)
 *   - OR a .env here with NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD
 *
 * Usage:
 *   pnpm seed:dev-app
 *   pnpm seed:dev-app --app-url http://localhost:4321
 *   pnpm seed:dev-app --app-url http://localhost:4321 --profile dev-user --install-for test-user
 *   pnpm seed:dev-app --app-name "My Game" --domain localhost
 *
 * Re-running is safe — the script is idempotent via slug-based lookup.
 */

// ---------------------------------------------------------------------------
// Environment bootstrap — MUST run before any imports that trigger neogma/cache
// initialization (e.g. @models, @accesslayer/*). ES `import` statements are
// hoisted by esbuild/tsx, so we use require() for dotenv and set defaults here
// at the top level before the dynamic imports in main().
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();

// Fall back to local docker-compose defaults so the script works without a .env
// when services are already running via `pnpm dev:services` from learn-card-app.
process.env.NEO4J_URI ??= 'bolt://localhost:7687';
process.env.NEO4J_USERNAME ??= 'neo4j';
process.env.NEO4J_PASSWORD ??= 'this-is-the-password';
process.env.REDIS_HOST ??= 'localhost';
process.env.REDIS_PORT ??= '6379';

// ---------------------------------------------------------------------------
// CLI argument parsing (no side-effectful imports needed)
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

const getArg = (flag: string, fallback: string): string => {
    const idx = args.indexOf(flag);

    if (idx !== -1 && args[idx + 1]) {
        return args[idx + 1]!;
    }

    return fallback;
};

const appUrl = getArg('--app-url', 'http://localhost:4321');
const appName = getArg('--app-name', 'Dev Partner App');
const ownerProfileId = getArg('--profile', 'dev-owner');
const installForProfileId = getArg('--install-for', '');

const parsedUrl = new URL(appUrl);
const domain = getArg('--domain', parsedUrl.hostname);
const slug = getArg('--slug', appName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

// ---------------------------------------------------------------------------
// Main — dynamic imports so env vars are set before neogma initializes
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const { createProfile } = await import('@accesslayer/profile/create');
    const { getProfileByProfileId } = await import('@accesslayer/profile/read');
    const { readAppStoreListingBySlug } = await import('@accesslayer/app-store-listing/read');
    const { seedListedApp, installAppForProfile } = await import(
        '../test/helpers/app-store.helpers'
    );

    console.log('\n🔧 Seeding dev partner app...\n');

    // 1. Ensure owner profile exists
    let ownerProfile = await getProfileByProfileId(ownerProfileId);

    if (!ownerProfile) {
        console.log(`  Creating owner profile: ${ownerProfileId}`);

        ownerProfile = await createProfile({
            profileId: ownerProfileId,
            displayName: ownerProfileId,
            shortBio: 'Dev seed profile',
        });
    } else {
        console.log(`  Owner profile already exists: ${ownerProfileId}`);
    }

    // 2. Check for existing listing by slug (idempotency)
    const existing = await readAppStoreListingBySlug(slug);

    if (existing) {
        console.log(`  Listing already exists for slug "${slug}": ${existing.listing_id}`);
        console.log(`  Skipping creation. Delete it manually or use a different --slug.\n`);
        printSummary(existing.listing_id);
        return;
    }

    // 3. Create integration + listing
    const whitelistedDomains = [domain, `${domain}:${parsedUrl.port || '80'}`];

    const { listing, integration } = await seedListedApp(
        ownerProfileId,
        {
            display_name: appName,
            slug,
            tagline: `Dev app at ${appUrl}`,
            full_description: `Locally seeded partner app pointing at ${appUrl}`,
            launch_config_json: JSON.stringify({ url: appUrl }),
        },
        `${appName} Integration`,
        whitelistedDomains
    );

    console.log(`  Integration created: ${integration.id}`);
    console.log(`  Whitelisted domains: ${whitelistedDomains.join(', ')}`);
    console.log(`  Listing created:     ${listing.listing_id}`);
    console.log(`  Slug:                ${slug}`);
    console.log(`  Status:              ${listing.app_listing_status}`);
    console.log(`  Launch URL:          ${appUrl}`);

    // 4. Optionally install for a second profile
    if (installForProfileId && installForProfileId !== ownerProfileId) {
        let installProfile = await getProfileByProfileId(installForProfileId);

        if (!installProfile) {
            console.log(`\n  Creating install profile: ${installForProfileId}`);

            installProfile = await createProfile({
                profileId: installForProfileId,
                displayName: installForProfileId,
                shortBio: 'Dev seed user',
            });
        }

        await installAppForProfile(installForProfileId, listing.listing_id);

        console.log(`  App installed for: ${installForProfileId}`);
    }

    printSummary(listing.listing_id);
}

function printSummary(listingId: string): void {
    console.log('\n✅ Done! Seed summary:');
    console.log('─'.repeat(50));
    console.log(`  Listing ID:    ${listingId}`);
    console.log(`  Slug:          ${slug}`);
    console.log(`  Owner:         ${ownerProfileId}`);
    console.log(`  App URL:       ${appUrl}`);
    console.log(`  Domain:        ${domain}`);

    if (installForProfileId) {
        console.log(`  Installed for: ${installForProfileId}`);
    }

    console.log('─'.repeat(50));
    console.log('\n  Use this listing ID in your app or .env:\n');
    console.log(`    LISTING_ID=${listingId}\n`);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n❌ Seed failed:', err);
        process.exit(1);
    });
