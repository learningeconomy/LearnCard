#!/usr/bin/env tsx
/**
 * Seed a dev partner app into the local brain-service database.
 *
 * Prerequisites:
 *   - Neo4j running (docker compose up neo4j)
 *   - .env with NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD
 *
 * Usage:
 *   pnpm seed:dev-app
 *   pnpm seed:dev-app --app-url http://localhost:4321
 *   pnpm seed:dev-app --app-url http://localhost:4321 --profile dev-user --install-for test-user
 *   pnpm seed:dev-app --app-name "My Game" --domain localhost
 *
 * Re-running is safe — the script is idempotent via slug-based lookup.
 */

import dotenv from 'dotenv';

dotenv.config();

// These imports trigger neogma/cache initialization from env vars
import { Profile } from '@models';
import { createProfile } from '@accesslayer/profile/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { readAppStoreListingBySlug } from '@accesslayer/app-store-listing/read';
import {
    seedIntegration,
    seedListedApp,
    installAppForProfile,
} from '../test/helpers/app-store.helpers';

// ---------------------------------------------------------------------------
// CLI argument parsing
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
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
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
