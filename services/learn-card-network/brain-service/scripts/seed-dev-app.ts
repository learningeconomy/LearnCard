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
 * Two modes:
 *
 *   1. Single-app (default) — seeds one listing from CLI flags.
 *      pnpm seed:dev-app
 *      pnpm seed:dev-app --app-url http://localhost:4321
 *      pnpm seed:dev-app --app-url http://localhost:4321 --profile dev-user --install-for test-user
 *      pnpm seed:dev-app --app-name "My Game" --domain localhost
 *      pnpm seed:dev-app --app-image https://example.com/my-icon.png
 *      pnpm seed:dev-app --template-alias my-badge
 *      pnpm seed:dev-app --sa-endpoint http://localhost:5100/api
 *      pnpm seed:dev-app --permissions request_identity,send_credential
 *      pnpm seed:dev-app --launch-type DIRECT_LINK        (default: EMBEDDED_IFRAME)
 *      pnpm seed:dev-app --promotion FEATURED_CAROUSEL
 *      pnpm seed:dev-app --reset-rate-limits
 *
 *   2. Preset bundle — seeds a curated set of listings in one go. Used to
 *      scaffold the demo data the Pathways v0.5 ActionDescriptor flow depends
 *      on (see `apps/learn-card-app/src/pages/pathways/dev/devSeed.ts`).
 *      pnpm seed:dev-app --preset pathway-demo
 *
 * Preset listings use **deterministic UUIDs** (`uuidv5(slug, NAMESPACE)`) so
 * the in-app dev seed can reference listing_ids without a lookup round-trip.
 * Re-running is always safe — the script is idempotent via slug-based lookup.
 */

import * as dotenv from 'dotenv';
import { Neogma } from 'neogma';
import Redis from 'ioredis';
import { MongoClient } from 'mongodb';
import * as crypto from 'crypto';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';
import { v4 as uuid, v5 as uuidv5 } from 'uuid';

dotenv.config();

// ---------------------------------------------------------------------------
// Preset registry
// ---------------------------------------------------------------------------
//
// Presets are curated bundles of listings we want seedable in a single call.
// The `pathway-demo` preset backs the AWS Cloud Practitioner demo pathway in
// `apps/learn-card-app/src/pages/pathways/dev/devSeed.ts`; its listing_ids are
// derived from slugs so both sides can share constants without IPC.

/**
 * Fixed namespace UUID for `uuidv5`. Do not change — derived listing_ids are
 * persisted to Neo4j and referenced by the in-app dev seed. Treat as an API.
 */
const PRESET_LISTING_NAMESPACE = '5b9f3a24-7c1e-4d6a-9f2b-8e4c3a1d5f6b';

/**
 * Helper: deterministic listing_id for preset entries. Exposed so the
 * in-app dev seed can reproduce the same mapping from its own constants file.
 */
export const presetListingId = (slug: string): string =>
    uuidv5(slug, PRESET_LISTING_NAMESPACE);

interface PresetEntry {
    slug: string;
    appName: string;
    appUrl: string;
    launchType:
        | 'EMBEDDED_IFRAME'
        | 'SECOND_SCREEN'
        | 'DIRECT_LINK'
        | 'CONSENT_REDIRECT'
        | 'SERVER_HEADLESS'
        | 'AI_TUTOR';
    category: string;
    tagline: string;
    fullDescription: string;
    iconUrl: string;
}

/**
 * AWS Cloud Practitioner demo bundle — exercises three of the six launch
 * types so the Pathways ActionDescriptor dispatch can demo every meaningful
 * in-app path (DIRECT_LINK leaves the app, EMBEDDED_IFRAME opens inline,
 * AI_TUTOR renders the MCP-backed chat surface).
 */
// All three listings back routes of the `5-northstar-learning` example app
// (see `examples/app-store-apps/5-northstar-learning/`). Each one exercises
// a different credential-matcher kind on the demo pathway: credential-type
// (course), score-threshold (practice), ob-achievement (coaching). The URLs
// below are the local dev ports; override at seed time with `--app-url` if
// you're pointing the Astro app at a staging host.
//
// The `demo-coursera-aws-essentials` slug is kept historical for UUIDv5
// stability — renaming it would break every previously-seeded listing_id.
// Read it as a stable opaque identifier; the surfaced brand is Northstar.
const PATHWAY_DEMO_PRESET: PresetEntry[] = [
    {
        slug: 'demo-coursera-aws-essentials',
        appName: 'Northstar — Cloud Essentials',
        appUrl: 'http://localhost:4321/course',
        launchType: 'DIRECT_LINK',
        category: 'Learning',
        tagline: 'Video-led intro to EC2, S3, IAM, and VPC.',
        fullDescription:
            'Northstar Learning’s structured Cloud Essentials course. Work through four chapters on EC2, S3, IAM, and VPC; mark complete to receive your AWSCloudEssentialsCompletion credential automatically.',
        iconUrl: 'https://cdn.filestackcontent.com/RXaNgRHTHCNr3meO1G0A',
    },
    {
        slug: 'demo-aws-practice-studio',
        appName: 'Northstar — Practice Exams',
        appUrl: 'http://localhost:4321/practice',
        launchType: 'EMBEDDED_IFRAME',
        category: 'Practice',
        tagline: 'Timed AWS Cloud Practitioner practice exams.',
        fullDescription:
            'Five timed Cloud Practitioner practice exams with a running average score. Submitting your practice log issues an AWSPracticeExamScore credential; the pathway unlocks when your average clears 80%.',
        iconUrl: 'https://cdn.filestackcontent.com/erbcRQfTG2TktX2hcmLu',
    },
    {
        slug: 'demo-aws-cloud-coach',
        appName: 'Northstar — AI Coach',
        appUrl: 'http://localhost:4321/coaching',
        launchType: 'AI_TUTOR',
        category: 'Tutor',
        tagline: 'One-on-one coaching drills on your weakest AWS topics.',
        fullDescription:
            'AI-driven coaching drills targeted at the topics your practice exams flagged as weak. Finishing a drill issues an OBv3-shaped coaching badge that closes out the coaching node of your pathway.',
        iconUrl: 'https://cdn.filestackcontent.com/aWUPGBPRFenRT9taokA6',
    },
];

const PRESETS: Record<string, PresetEntry[]> = {
    'pathway-demo': PATHWAY_DEMO_PRESET,
};

// Fall back to local docker-compose defaults so the script works without a .env
// when services are already running via `pnpm dev:services` from learn-card-app.
const NEO4J_URI = process.env.NEO4J_URI ?? 'bolt://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME ?? 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? 'this-is-the-password';

const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? '6379', 10);

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/?replicaSet=rs0';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME ?? 'lca-api';

// Brain-service domain used for did:web construction
const BRAIN_DOMAIN = process.env.DOMAIN_NAME ?? 'localhost%3A4000';

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

const ALL_PERMISSIONS = [
    'request_identity',
    'send_credential',
    'launch_feature',
    'credential_search',
    'credential_by_id',
    'request_consent',
    'template_issuance',
];

/**
 * Per-listing config. All the knobs that used to be module-level constants
 * now live here; `buildSingleListingConfig` (CLI mode) and `buildPresetConfig`
 * (preset mode) both produce this shape so `seedListing` never cares which
 * mode kicked it off.
 */
interface ListingConfig {
    /** Deterministic for presets (`presetListingId(slug)`); fresh uuid for single-CLI. */
    listingId: string;
    slug: string;
    appName: string;
    appUrl: string;
    domain: string;
    iconUrl: string;
    launchType: PresetEntry['launchType'];
    category: string;
    tagline: string;
    fullDescription: string;
    promotionLevel: string;
    permissions: string[];
    templateAlias: string;
    saEndpoint: string;
    saSeed: string;
    ownerProfileId: string;
    /** Empty string disables install; keeping string (not `string | null`) preserves prior CLI semantics. */
    installForProfileId: string;
}

// Flags that live outside any single listing (apply to the run itself):
const presetName = getArg('--preset', '');
const resetRateLimits = args.includes('--reset-rate-limits');

/**
 * Build a single ListingConfig from CLI flags. Mirrors the pre-refactor
 * module-level constants exactly — fallbacks, derived domain/slug, permission
 * expansion — so `--preset`-less invocations are bit-for-bit compatible.
 */
const buildSingleListingConfig = (): ListingConfig => {
    const appUrl = getArg('--app-url', 'http://localhost:4321');
    const appName = getArg('--app-name', 'Dev Partner App');
    const parsedUrl = new URL(appUrl);
    const slug = getArg('--slug', appName.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    const permissionsRaw = getArg('--permissions', '');

    return {
        // Single-CLI mode keeps random UUIDs — no cross-process coordination
        // needed, and re-runs still hit the idempotent slug-based MERGE.
        listingId: uuid(),
        slug,
        appName,
        appUrl,
        domain: getArg('--domain', parsedUrl.hostname),
        iconUrl: getArg('--app-image', ''),
        launchType: getArg('--launch-type', 'EMBEDDED_IFRAME') as PresetEntry['launchType'],
        category: getArg('--category', 'Learning'),
        tagline: getArg('--tagline', `Dev app at ${appUrl}`),
        fullDescription: getArg(
            '--full-description',
            `Locally seeded partner app pointing at ${appUrl}`,
        ),
        promotionLevel: getArg('--promotion', 'FEATURED_CAROUSEL'),
        permissions: permissionsRaw
            ? permissionsRaw.split(',').map(p => p.trim())
            : ALL_PERMISSIONS,
        templateAlias: getArg('--template-alias', 'default'),
        saEndpoint: getArg('--sa-endpoint', 'http://localhost:5100/api'),
        saSeed: getArg('--sa-seed', 'd'.repeat(64)),
        ownerProfileId: getArg('--profile', 'dev-owner'),
        installForProfileId: getArg('--install-for', ''),
    };
};

/**
 * Build the ListingConfig array for a named preset. Each preset entry is
 * turned into a full config; shared fields (owner profile, SA endpoint,
 * permissions) come from CLI flags so you can e.g. seed the demo bundle under
 * a specific owner with `--preset pathway-demo --profile alice`.
 */
const buildPresetConfigs = (name: string): ListingConfig[] => {
    const entries = PRESETS[name];

    if (!entries) {
        const known = Object.keys(PRESETS).join(', ') || '(none registered)';
        throw new Error(`Unknown preset "${name}". Known presets: ${known}`);
    }

    const ownerProfileId = getArg('--profile', 'dev-owner');
    const installForProfileId = getArg('--install-for', '');
    const saEndpoint = getArg('--sa-endpoint', 'http://localhost:5100/api');
    const saSeed = getArg('--sa-seed', 'd'.repeat(64));
    const templateAlias = getArg('--template-alias', 'default');
    const promotionLevel = getArg('--promotion', 'FEATURED_CAROUSEL');
    const permissionsRaw = getArg('--permissions', '');
    const permissions = permissionsRaw
        ? permissionsRaw.split(',').map(p => p.trim())
        : ALL_PERMISSIONS;

    return entries.map(entry => {
        const parsedUrl = new URL(entry.appUrl);

        return {
            listingId: presetListingId(entry.slug),
            slug: entry.slug,
            appName: entry.appName,
            appUrl: entry.appUrl,
            domain: parsedUrl.hostname,
            iconUrl: entry.iconUrl,
            launchType: entry.launchType,
            category: entry.category,
            tagline: entry.tagline,
            fullDescription: entry.fullDescription,
            promotionLevel,
            permissions,
            templateAlias,
            saEndpoint,
            saSeed,
            ownerProfileId,
            installForProfileId,
        };
    });
};

// ---------------------------------------------------------------------------
// Helpers — mirrors the access-layer logic but uses raw Cypher to avoid
// importing @models (which has circular deps that break under tsx/CJS).
// ---------------------------------------------------------------------------

const transformProfileId = (raw: string): string => raw.toLowerCase().replace(/:/g, '%3A');

const getDidWeb = (domain: string, profileId: string): string =>
    `did:web:${domain}:users:${profileId}`;

const getAppDidWeb = (domain: string, appSlug: string): string =>
    `did:web:${domain}:app:${appSlug}`;

// Derive the did:key for an ed25519 key pair from a hex seed.
// The brain-service DID doc endpoint filters out did:web DIDs on the
// USES_SIGNING_AUTHORITY relationship, so we must store a did:key there.
const deriveDidKeyFromSeed = (hexSeed: string): string => {
    const seedBytes = Buffer.from(hexSeed.slice(0, 64), 'hex');
    const keyPair = nacl.sign.keyPair.fromSeed(seedBytes);
    const multicodec = Buffer.concat([Buffer.from('ed01', 'hex'), Buffer.from(keyPair.publicKey)]);

    return `did:key:z${bs58.encode(multicodec)}`;
};

// Minimal OBv3 credential template that the example app can issue.
// Mustache variable {{issuedAt}} is filled in by the SDK's templateData.
const buildCredentialTemplate = (name: string): string =>
    JSON.stringify({
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        issuer: { id: 'did:example:issuer', type: ['Profile'], name },
        issuanceDate: '{{issuedAt}}',
        credentialSubject: {
            type: ['AchievementSubject'],
            achievement: {
                id: `urn:uuid:${uuid()}`,
                type: ['Achievement'],
                name: `${name} Achievement`,
                description: `Credential issued by ${name}`,
                criteria: { narrative: 'Earned through the partner app' },
            },
        },
    });

// ---------------------------------------------------------------------------
// Main — dispatches single-CLI vs preset and drives the per-listing pipeline.
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const neogma = new Neogma({ url: NEO4J_URI, username: NEO4J_USERNAME, password: NEO4J_PASSWORD });

    try {
        const configs = presetName
            ? buildPresetConfigs(presetName)
            : [buildSingleListingConfig()];

        if (presetName) {
            console.log(`\n🔧 Seeding preset "${presetName}" (${configs.length} listing${configs.length === 1 ? '' : 's'})...\n`);
        } else {
            console.log('\n🔧 Seeding dev partner app...\n');
        }

        for (const config of configs) {
            await seedListing(neogma, config);
        }

        // Rate-limit reset is a run-level flag (not per-listing), so it fires
        // once over every seeded listing at the end. Keeps flag semantics
        // consistent with the pre-refactor script.
        if (resetRateLimits) {
            for (const config of configs) {
                await clearRateLimits(config.listingId);
            }
        }
    } finally {
        await neogma.driver.close();
    }
}

/**
 * Seed one AppStoreListing (and its supporting nodes) through the idempotent
 * slug-keyed path. Cleanly swallow-proof: every step is MERGE-safe except the
 * first-time CREATE, which is only reached when the slug lookup misses.
 *
 * The big move from the pre-refactor version: every field that used to read
 * from module-level `appName` / `slug` / `permissions` / etc. is now sourced
 * from `config` so the preset-loop caller and the single-CLI caller produce
 * identical DB state.
 */
async function seedListing(neogma: Neogma, config: ListingConfig): Promise<void> {
    const run = neogma.queryRunner.run.bind(neogma.queryRunner);
    const parsedUrl = new URL(config.appUrl);
    const normalizedProfileId = transformProfileId(config.ownerProfileId);

    console.log(`\n— ${config.appName} (${config.launchType}) —`);

    // 1. Ensure owner profile exists (MERGE = idempotent)
    const profileResult = await run(
        `MERGE (p:Profile {profileId: $profileId})
         ON CREATE SET p.displayName = $displayName,
                       p.shortBio    = $shortBio,
                       p.did         = $did
         RETURN p, p.did AS existed`,
        {
            profileId: normalizedProfileId,
            displayName: config.ownerProfileId,
            shortBio: 'Dev seed profile',
            did: `did:seed:${normalizedProfileId}`,
        }
    );

    const profileNode = profileResult.records[0]?.get('p')?.properties;

    if (profileNode) {
        console.log(`  Owner profile ready: ${normalizedProfileId}`);
    }

    // 2. Check for existing listing by slug (idempotency anchor).
    const existingResult = await run(
        `MATCH (listing:AppStoreListing {slug: $slug})
         RETURN listing.listing_id AS listing_id
         LIMIT 1`,
        { slug: config.slug }
    );

    const existingId = existingResult.records[0]?.get('listing_id');
    const launchConfigJson = JSON.stringify({ url: config.appUrl, permissions: config.permissions });

    if (existingId) {
        console.log(`  Listing already exists for slug "${config.slug}": ${existingId}`);

        // Update the mutable fields so re-running the preset picks up edits
        // (launch type, promotion, URL, icon, permissions). Note: listing_id
        // and slug are immutable here — changing either would orphan the node.
        await run(
            `MATCH (l:AppStoreListing {listing_id: $listingId})
             SET l.promotion_level    = $promotionLevel,
                 l.launch_config_json = $launchConfigJson,
                 l.launch_type        = $launchType,
                 l.display_name       = $displayName,
                 l.tagline            = $tagline,
                 l.full_description   = $fullDescription,
                 l.category           = $category
             ${config.iconUrl ? ', l.icon_url = $iconUrl' : ''}
             RETURN l`,
            {
                listingId: existingId,
                promotionLevel: config.promotionLevel,
                launchConfigJson,
                launchType: config.launchType,
                displayName: config.appName,
                tagline: config.tagline,
                fullDescription: config.fullDescription,
                category: config.category,
                ...(config.iconUrl && { iconUrl: config.iconUrl }),
            }
        );

        console.log(`  Updated launch_type     → ${config.launchType}`);
        console.log(`  Updated promotion_level → ${config.promotionLevel}`);

        // Ensure boost + signing authority exist even on re-runs.
        await ensureBoostAndSigningAuthority(run, existingId, normalizedProfileId, config);

        printSummary(existingId, config);
        return;
    }

    // 3. Create Integration (CREATED_BY the owner profile). Whitelisted
    // domains are "mostly metadata" for DIRECT_LINK entries — the real
    // enforcement kicks in for EMBEDDED_IFRAME where the iframe origin has
    // to match. We seed both hostname and hostname:port for parity with
    // what the pre-refactor single-app path did.
    const integrationId = uuid();
    const whitelistedDomains = [config.domain, `${config.domain}:${parsedUrl.port || '80'}`];

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
            name: `${config.appName} Integration`,
            description: `Integration for ${config.appName}`,
            publishableKey: `pk_${uuid()}`,
            whitelistedDomains,
            status: 'setup',
            createdAt: new Date().toISOString(),
            profileId: normalizedProfileId,
        }
    );

    console.log(`  Integration created: ${integrationId}`);
    console.log(`  Whitelisted domains: ${whitelistedDomains.join(', ')}`);

    // 4. Create the AppStoreListing itself. `listing_id` is deterministic
    // for presets and random for single-CLI — see ListingConfig.
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
            listingId: config.listingId,
            slug: config.slug,
            displayName: config.appName,
            tagline: config.tagline,
            fullDescription: config.fullDescription,
            iconUrl: config.iconUrl || 'https://placehold.co/250x250/orange/white?text=App',
            status: 'LISTED',
            launchType: config.launchType,
            launchConfigJson,
            category: config.category,
            promotionLevel: config.promotionLevel,
            integrationId,
        }
    );

    console.log(`  Listing created:     ${config.listingId}`);
    console.log(`  Slug:                ${config.slug}`);
    console.log(`  Launch type:         ${config.launchType}`);
    console.log(`  Promotion:           ${config.promotionLevel}`);
    console.log(`  Launch URL:          ${config.appUrl}`);

    // 5. Boost + signing authority for credential issuance.
    await ensureBoostAndSigningAuthority(run, config.listingId, normalizedProfileId, config);

    // 6. Optionally install for a second profile (learner-side dev data).
    if (config.installForProfileId && config.installForProfileId !== config.ownerProfileId) {
        const normalizedInstallId = transformProfileId(config.installForProfileId);

        await run(
            `MERGE (p:Profile {profileId: $profileId})
             ON CREATE SET p.displayName = $displayName,
                           p.shortBio    = $shortBio,
                           p.did         = $did
             RETURN p`,
            {
                profileId: normalizedInstallId,
                displayName: config.installForProfileId,
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
                listingId: config.listingId,
                installedAt: new Date().toISOString(),
            }
        );

        console.log(`  App installed for:   ${config.installForProfileId}`);
    }

    printSummary(config.listingId, config);
}

// ---------------------------------------------------------------------------
// Boost + Signing Authority setup
// ---------------------------------------------------------------------------

async function ensureBoostAndSigningAuthority(
    run: Neogma['queryRunner']['run'],
    listingId: string,
    profileId: string,
    config: ListingConfig
): Promise<void> {
    // Check if a boost with this templateAlias already exists for the listing
    const existingBoost = await run(
        `MATCH (l:AppStoreListing {listing_id: $listingId})-[r:HAS_BOOST {templateAlias: $templateAlias}]->(b:Boost)
         RETURN b.id AS boostId`,
        { listingId, templateAlias: config.templateAlias }
    );

    const existingBoostId = existingBoost.records[0]?.get('boostId');

    if (!existingBoostId) {
        const boostId = uuid();
        const boostJson = buildCredentialTemplate(config.appName);

        await run(
            `CREATE (b:Boost {
                id: $boostId,
                boost: $boostJson,
                name: $name,
                category: $category,
                status: 'LIVE'
             })
             WITH b
             MATCH (p:Profile {profileId: $profileId})
             CREATE (b)-[:CREATED_BY {date: $date}]->(p)
             WITH b
             MATCH (l:AppStoreListing {listing_id: $listingId})
             CREATE (l)-[:HAS_BOOST {templateAlias: $templateAlias, createdAt: $date}]->(b)
             RETURN b`,
            {
                boostId,
                boostJson,
                name: `${config.appName} Badge`,
                category: 'Achievement',
                profileId,
                listingId,
                templateAlias: config.templateAlias,
                date: new Date().toISOString(),
            }
        );

        console.log(`  Boost created:       ${boostId} (alias: "${config.templateAlias}")`);
    } else {
        console.log(`  Boost exists:        ${existingBoostId} (alias: "${config.templateAlias}")`);
    }

    const existingSa = await run(
        `MATCH (l:AppStoreListing {listing_id: $listingId})-[r:USES_SIGNING_AUTHORITY]->(sa:SigningAuthority)
         RETURN sa.endpoint AS endpoint`,
        { listingId }
    );

    const appDid = getAppDidWeb(BRAIN_DOMAIN, config.slug);
    const saDidKey = deriveDidKeyFromSeed(config.saSeed);

    if (!existingSa.records.length) {
        await run(
            `MERGE (sa:SigningAuthority {endpoint: $endpoint})
             WITH sa
             MATCH (l:AppStoreListing {listing_id: $listingId})
             CREATE (l)-[:USES_SIGNING_AUTHORITY {
                 name: $name,
                 did: $did,
                 isPrimary: true
             }]->(sa)
             RETURN sa`,
            {
                endpoint: config.saEndpoint,
                listingId,
                name: 'default',
                did: saDidKey,
            }
        );

        console.log(`  Signing authority:   ${config.saEndpoint} (linked to listing)`);
        console.log(`  SA did:key:          ${saDidKey}`);

        // Also link SA to the owner profile (fallback path used when the
        // brain-service can't find a listing-level SA relationship).
        await run(
            `MATCH (sa:SigningAuthority {endpoint: $endpoint})
             MATCH (p:Profile {profileId: $profileId})
             MERGE (p)-[r:USES_SIGNING_AUTHORITY]->(sa)
             ON CREATE SET r.name = $name, r.did = $did, r.isPrimary = true
             RETURN r`,
            {
                endpoint: config.saEndpoint,
                profileId,
                name: 'default',
                did: saDidKey,
            }
        );
    } else {
        console.log(`  Signing authority:   already configured`);
    }

    // Always ensure MongoDB SA exists (idempotent).
    // The brain-service sends the *app* DID (not the user DID) as
    // ownerDidOverride when calling /credentials/issue, so MongoDB must key
    // the SA by the app DID.
    await ensureMongoSigningAuthority(appDid, config.saSeed);
}

async function ensureMongoSigningAuthority(ownerDid: string, saSeed: string): Promise<void> {
    let client: MongoClient | undefined;

    try {
        client = new MongoClient(MONGO_URI);
        await client.connect();

        const db = client.db(MONGO_DB_NAME);
        const collection = db.collection('signingauthorities');

        const existing = await collection.findOne({ ownerDid, name: 'default' });

        if (!existing) {
            const did = `did:key:z${crypto.createHash('sha256').update(saSeed).digest('hex').slice(0, 48)}`;

            await collection.insertOne({
                _id: uuid(),
                ownerDid,
                name: 'default',
                seed: saSeed,
                did,
            } as any);

            console.log(`  MongoDB SA created:  ownerDid=${ownerDid}`);
        } else {
            console.log(`  MongoDB SA exists:   ownerDid=${ownerDid}`);
        }
    } catch (err) {
        console.warn(`\n\u26A0\uFE0F  Could not connect to MongoDB at ${MONGO_URI} — skipping SA setup.`);
        console.warn('  Credential issuance (sendCredential) will not work without the LCA API signing authority.');
    } finally {
        await client?.close();
    }
}

// ---------------------------------------------------------------------------
// Rate-limit reset
// ---------------------------------------------------------------------------

async function clearRateLimits(listingId: string): Promise<void> {
    const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, lazyConnect: true });

    try {
        await redis.connect();
    } catch (err) {
        console.warn(`\n⚠️  Could not connect to Redis at ${REDIS_HOST}:${REDIS_PORT} — skipping rate-limit reset.`);
        return;
    }

    console.log('\n🔄 Resetting rate limits...');

    // Key patterns used by brain-service:
    //   app-notif-rate:{listingId}:*          (SDK sendNotification — 10/hr/user)
    //   app-notif-server-rate:{listingId}     (server notify route — 60/hr)
    //   app-counter-rate:{listingId}:*        (SDK incrementCounter — 100/min/user)
    const patterns = [
        `app-notif-rate:${listingId}:*`,
        `app-notif-server-rate:${listingId}`,
        `app-counter-rate:${listingId}:*`,
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
        const keys: string[] = [];
        const stream = redis.scanStream({ match: pattern });

        for await (const batch of stream) {
            keys.push(...(batch as string[]));
        }

        if (keys.length > 0) {
            await redis.unlink(...keys);
            totalDeleted += keys.length;
        }
    }

    // Also delete the exact server-rate key (single key, not a pattern)
    const serverKey = `app-notif-server-rate:${listingId}`;
    const existed = await redis.unlink(serverKey);

    if (existed && totalDeleted === 0) {
        totalDeleted += existed;
    }

    console.log(`  Cleared ${totalDeleted} rate-limit key(s)`);

    await redis.quit();
}

function printSummary(listingId: string, config: ListingConfig): void {
    console.log('\n✅ Done! Seed summary:');
    console.log('─'.repeat(50));
    console.log(`  Listing ID:      ${listingId}`);
    console.log(`  Slug:            ${config.slug}`);
    console.log(`  Owner:           ${config.ownerProfileId}`);
    console.log(`  App URL:         ${config.appUrl}`);
    console.log(`  Domain:          ${config.domain}`);
    console.log(`  Launch Type:     ${config.launchType}`);
    console.log(`  Promotion:       ${config.promotionLevel}`);
    console.log(`  Template Alias:  ${config.templateAlias}`);
    console.log(`  SA Endpoint:     ${config.saEndpoint}`);
    console.log(`  Permissions:     ${config.permissions.join(', ')}`);

    if (config.installForProfileId) {
        console.log(`  Installed for:   ${config.installForProfileId}`);
    }

    console.log('─'.repeat(50));
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n❌ Seed failed:', err);
        process.exit(1);
    });
