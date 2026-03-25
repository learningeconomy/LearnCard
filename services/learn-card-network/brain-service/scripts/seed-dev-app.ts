#!/usr/bin/env tsx
/**
 * Seed a dev partner app into the local brain-service database.
 *
 * This script uses raw Cypher queries via a standalone Neogma instance so it
 * doesn't depend on the brain-service model layer (which has circular deps
 * that break under tsx's CJS transform).
 *
 * Prerequisites:
 *   - Neo4j running (e.g. `pnpm dev:services` from apps/learn-card-app)
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

import * as dotenv from 'dotenv';
import { Neogma } from 'neogma';
import { v4 as uuid } from 'uuid';

dotenv.config();

// Fall back to local docker-compose defaults so the script works without a .env
// when services are already running via `pnpm dev:services` from learn-card-app.
const NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME ?? 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? 'this-is-the-password';

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
// Helpers — mirrors the access-layer logic but uses raw Cypher to avoid
// importing @models (which has circular deps that break under tsx/CJS).
// ---------------------------------------------------------------------------

const transformProfileId = (raw: string): string => raw.toLowerCase().replace(':', '%3A');

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const neogma = new Neogma({ url: NEO4J_URI, username: NEO4J_USERNAME, password: NEO4J_PASSWORD });
    const run = neogma.queryRunner.run.bind(neogma.queryRunner);

    console.log('\n🔧 Seeding dev partner app...\n');

    const normalizedProfileId = transformProfileId(ownerProfileId);

    // 1. Ensure owner profile exists (MERGE = idempotent)
    const profileResult = await run(
        `MERGE (p:Profile {profileId: $profileId})
         ON CREATE SET p.displayName = $displayName,
                       p.shortBio    = $shortBio,
                       p.did         = $did
         RETURN p, p.did AS existed`,
        {
            profileId: normalizedProfileId,
            displayName: ownerProfileId,
            shortBio: 'Dev seed profile',
            did: `did:seed:${normalizedProfileId}`,
        }
    );

    const profileNode = profileResult.records[0]?.get('p')?.properties;

    if (profileNode) {
        console.log(`  Owner profile ready: ${normalizedProfileId}`);
    }

    // 2. Check for existing listing by slug (idempotency)
    const existingResult = await run(
        `MATCH (listing:AppStoreListing {slug: $slug})
         RETURN listing.listing_id AS listing_id
         LIMIT 1`,
        { slug }
    );

    const existingId = existingResult.records[0]?.get('listing_id');

    if (existingId) {
        console.log(`  Listing already exists for slug "${slug}": ${existingId}`);
        console.log(`  Skipping creation. Delete it manually or use a different --slug.\n`);
        printSummary(existingId);
        await neogma.driver.close();
        return;
    }

    // 3. Create integration
    const integrationId = uuid();
    const whitelistedDomains = [domain, `${domain}:${parsedUrl.port || '80'}`];

    await run(
        `CREATE (i:Integration {
            id: $id,
            name: $name,
            description: $description,
            publishableKey: $publishableKey,
            whitelistedDomains: $whitelistedDomains,
            status: 'setup',
            createdAt: $createdAt
         })
         WITH i
         MATCH (p:Profile {profileId: $profileId})
         CREATE (i)-[:CREATED_BY]->(p)
         RETURN i`,
        {
            id: integrationId,
            name: `${appName} Integration`,
            description: `Integration for ${appName}`,
            publishableKey: `pk_${uuid()}`,
            whitelistedDomains,
            status: 'setup',
            createdAt: new Date().toISOString(),
            profileId: normalizedProfileId,
        }
    );

    console.log(`  Integration created: ${integrationId}`);
    console.log(`  Whitelisted domains: ${whitelistedDomains.join(', ')}`);

    // 4. Create app store listing + link to integration
    const listingId = uuid();

    await run(
        `CREATE (l:AppStoreListing {
            listing_id: $listingId,
            slug: $slug,
            display_name: $displayName,
            tagline: $tagline,
            full_description: $fullDescription,
            icon_url: $iconUrl,
            app_listing_status: $status,
            launch_type: $launchType,
            launch_config_json: $launchConfigJson,
            category: $category,
            promotion_level: $promotionLevel
         })
         WITH l
         MATCH (i:Integration {id: $integrationId})
         CREATE (i)-[:PUBLISHES_LISTING]->(l)
         RETURN l`,
        {
            listingId,
            slug,
            displayName: appName,
            tagline: `Dev app at ${appUrl}`,
            fullDescription: `Locally seeded partner app pointing at ${appUrl}`,
            iconUrl: 'https://example.com/icon.png',
            status: 'LISTED',
            launchType: 'EMBEDDED_IFRAME',
            launchConfigJson: JSON.stringify({ url: appUrl }),
            category: 'Learning',
            promotionLevel: 'STANDARD',
            integrationId,
        }
    );

    console.log(`  Listing created:     ${listingId}`);
    console.log(`  Slug:                ${slug}`);
    console.log(`  Status:              LISTED`);
    console.log(`  Launch URL:          ${appUrl}`);

    // 5. Optionally install for a second profile
    if (installForProfileId && installForProfileId !== ownerProfileId) {
        const normalizedInstallId = transformProfileId(installForProfileId);

        await run(
            `MERGE (p:Profile {profileId: $profileId})
             ON CREATE SET p.displayName = $displayName,
                           p.shortBio    = $shortBio,
                           p.did         = $did
             RETURN p`,
            {
                profileId: normalizedInstallId,
                displayName: installForProfileId,
                shortBio: 'Dev seed user',
                did: `did:seed:${normalizedInstallId}`,
            }
        );

        await run(
            `MATCH (p:Profile {profileId: $profileId})
             MATCH (l:AppStoreListing {listing_id: $listingId})
             MERGE (p)-[r:INSTALLS]->(l)
             ON CREATE SET r.listing_id   = $listingId,
                           r.installed_at = $installedAt
             RETURN r`,
            {
                profileId: normalizedInstallId,
                listingId,
                installedAt: new Date().toISOString(),
            }
        );

        console.log(`  App installed for: ${installForProfileId}`);
    }

    printSummary(listingId);

    await neogma.driver.close();
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
