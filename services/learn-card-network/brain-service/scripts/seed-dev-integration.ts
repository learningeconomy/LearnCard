#!/usr/bin/env bun
/**
 * Seed an INTEGRATION-kind App Store listing whose ListingVersion carries a real,
 * cryptographically signed `lc.integration` manifest — one the install-intent planner
 * (`planInstallIntent` → `assertSignedListingVersionOrThrow`) accepts.
 *
 * `seed:dev-app` seeds APP-kind listings, which never carry a signed manifest. This is
 * its INTEGRATION sibling: same owner-profile + Integration-node wiring, plus a LISTED
 * ListingVersion holding an EdDSA-signed manifest.
 *
 * Run with bun, not tsx: the access layer's circular imports only resolve under bun's
 * ESM loader, which is what lets this reuse the production signing helper
 * (`signManifestWithDidKey`) instead of hand-rolling JWS in raw Cypher.
 *
 *   bun run seed:dev-integration
 *   bun run seed:dev-integration --app-name "Acme SIS" --slug acme-sis
 *   bun run seed:dev-integration --category lms --capabilities-provided roster-source
 *   bun run seed:dev-integration --capabilities-provided insight-source --record-classes
 *   bun run seed:dev-integration --capabilities-provided registry-adapter --record-classes \
 *     --subscribes "ebsi|ebsi-tir|EBSI Trusted Issuers Registry|https://api-pilot.ebsi.eu/tir"
 *
 * `--subscribes` takes `declarationId|registryId|Display Name[|registryUrl]` entries separated
 * by `;`. ADR-015 D2: a registry-adapter Integration's signed manifest declares the
 * REGISTRY_SUBSCRIPTION(s) a singleton install of it establishes.
 *
 * `--console-surface` (requires --api-version lc.integration/v1.3) declares an ADR-015 FIRST_PARTY
 * console surface as `surfaceId|slug|Nav Label|navIcon|navSection|minimumRole[|requiredCaps,csv[|entryUrl]]`.
 *   bun run seed:dev-integration --profile my-owner --version 1.1.0
 *   bun run seed:dev-integration --ecosystem eco_dev_root
 *
 * Signing (see src/helpers/manifest-signature.helpers.ts): the publisher key is an
 * Ed25519 did:key derived from `--publisher-seed` (64 hex chars). The payload is the
 * manifest minus `signature`, with every object key recursively sorted, JSON-stringified.
 * That payload is signed as a compact JWS with `alg: EdDSA` and `kid` set to the
 * publisher's verificationMethod, and stored as `{ alg, sig, verificationMethod }`.
 * Verification re-resolves the publisher DID document, requires the method to appear in
 * `assertionMethod`, and compares the JWS payload against the recomputed canonical form.
 *
 * Idempotent: re-running repairs the fixture (relisting, re-signing a stale or unsigned
 * manifest) rather than duplicating it.
 */

import * as dotenv from 'dotenv';

import type { IntegrationManifest } from '@learncard/types';

dotenv.config();

// src/instance.ts requires NEO4J_* with no defaults, but the sibling dev scripts
// (seed-dev-app, seed-education-os) default to a local Neo4j. Match them so this works
// from a clean checkout without a .env.
const applyLocalDevDefaults = (): void => {
    process.env.NEO4J_URI ??= 'bolt://localhost:7687';
    process.env.NEO4J_USERNAME ??= 'neo4j';
    process.env.NEO4J_PASSWORD ??= 'this-is-the-password';
    process.env.DOMAIN_NAME ??= 'localhost%3A4000';
};

const arg = (name: string, fallback: string): string => {
    const index = process.argv.indexOf(`--${name}`);
    const value = index >= 0 ? process.argv[index + 1] : undefined;

    return value ?? fallback;
};

// An omitted flag takes the fallback; a valueless one (`--record-classes` with nothing or
// another flag after it) declares none. An ADR-013 Q4 reference feed carries no record
// class, and the fallback would silently re-add one. Valueless rather than `""` because
// `bun run <script> -- --flag ""` drops empty arguments before the script sees them.
const listArg = (name: string, fallback: string[]): string[] => {
    const index = process.argv.indexOf(`--${name}`);

    if (index < 0) return fallback;

    const raw = process.argv[index + 1];

    if (!raw || raw.startsWith('--')) return [];

    return raw
        .split(',')
        .map(entry => entry.trim())
        .filter(Boolean);
};

// Mirrors transformProfileId in @helpers/profile.helpers — profile ids are stored
// lowercased with ':' percent-encoded, and lookups compare against the stored form.
const normalizeProfileId = (raw: string): string => raw.toLowerCase().replace(/:/g, '%3A');

const slugify = (raw: string): string =>
    raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const main = async (): Promise<void> => {
    applyLocalDevDefaults();

    // Imported dynamically on purpose: the access layer reads NEO4J_* at module load,
    // and static imports would hoist above dotenv.config() and the defaults above.
    const { neogma } = await import('@instance');
    const { getLearnCard } = await import('@helpers/learnCard.helpers');
    const {
        assertSignedListingVersionOrThrow,
        computeManifestHash,
        listingKindRequiresSignedManifest,
        signManifestWithDidKey,
    } = await import('@helpers/manifest-signature.helpers');
    const { createProfile } = await import('@accesslayer/profile/create');
    const { getProfileByProfileId } = await import('@accesslayer/profile/read');
    const { createIntegration } = await import('@accesslayer/integration/create');
    const { associateIntegrationWithProfile } =
        await import('@accesslayer/integration/relationships/create');
    const { createAppStoreListing } = await import('@accesslayer/app-store-listing/create');
    const { readAppStoreListingById, readAppStoreListingBySlug } =
        await import('@accesslayer/app-store-listing/read');
    const { associateListingWithIntegration } =
        await import('@accesslayer/app-store-listing/relationships/create');
    const { createListingVersion } = await import('@accesslayer/listing-version/create');
    const { readListingVersionById } = await import('@accesslayer/listing-version/read');

    const appName = arg('app-name', 'Dev Integration');
    const slug = arg('slug', slugify(appName));
    const ownerProfileId = normalizeProfileId(arg('profile', 'dev-owner'));
    const publisherSeed = arg('publisher-seed', 'e'.repeat(64));
    const manifestId = arg('integration-id', `com.learncard.dev.${slug.replace(/-/g, '.')}`);
    const manifestVersion = arg('version', '1.0.0');
    const apiVersion = arg('api-version', 'lc.integration/v1.2');
    const category = arg('category', 'sis');
    const healthUrl = arg('health-url', 'http://localhost:4321/health');
    const connectUrl = arg('connect-url', 'http://localhost:4321/connect');
    const provided = listArg('capabilities-provided', ['roster-source']);
    const consumed = listArg('capabilities-consumed', []);
    const recordClasses = listArg('record-classes', ['academic']);
    const consentRequirements = listArg('consent-requirements', ['directory']);
    const subscribes = arg('subscribes', '')
        .split(';')
        .map(entry => entry.trim())
        .filter(Boolean)
        .map(entry => {
            const [declarationId, registryId, displayName, registryUrl] = entry.split('|');

            if (!declarationId || !registryId || !displayName) {
                throw new Error(
                    `--subscribes entry "${entry}" must be declarationId|registryId|Display Name[|registryUrl]`
                );
            }

            return {
                declarationId,
                registryId,
                displayName,
                ...(registryUrl ? { registryUrl } : {}),
            };
        });
    const consoleSurfaces = arg('console-surface', '')
        .split(';')
        .map(entry => entry.trim())
        .filter(Boolean)
        .map(entry => {
            const [surfaceId, slug, navLabel, navIcon, navSection, minimumRole, caps, entryUrl] =
                entry.split('|');

            if (!surfaceId || !slug || !navLabel || !navIcon || !navSection || !minimumRole) {
                throw new Error(
                    `--console-surface entry "${entry}" must be surfaceId|slug|Nav Label|navIcon|navSection|minimumRole[|caps[|entryUrl]]`
                );
            }

            return {
                renderer: 'FIRST_PARTY' as const,
                surfaceId,
                slug,
                navLabel,
                navIcon: navIcon as IntegrationManifest['consoleSurfaces'][number]['navIcon'],
                navSection:
                    navSection as IntegrationManifest['consoleSurfaces'][number]['navSection'],
                minimumRole:
                    minimumRole as IntegrationManifest['consoleSurfaces'][number]['minimumRole'],
                requiredCapabilities: (caps
                    ? caps.split(',').filter(Boolean)
                    : []) as IntegrationManifest['consoleSurfaces'][number]['requiredCapabilities'],
                requiredScopes: [],
                ...(entryUrl ? { entryUrl } : {}),
            };
        });
    const ecosystemId = arg('ecosystem', '');

    console.log('\n🔧 Seeding dev INTEGRATION listing...\n');

    const publisherLearnCard = await getLearnCard(publisherSeed);
    const publisherDid = publisherLearnCard.id.did();

    console.log(`  Publisher DID:       ${publisherDid}`);

    if (await getProfileByProfileId(ownerProfileId)) {
        console.log(`  Owner profile:       ${ownerProfileId} (exists)`);
    } else {
        await createProfile({
            profileId: ownerProfileId,
            did: `did:seed:${ownerProfileId}`,
            displayName: ownerProfileId,
            shortBio: 'Dev seed profile',
        } as Parameters<typeof createProfile>[0]);

        console.log(`  Owner profile:       ${ownerProfileId} (created)`);
    }

    const existingListing = await readAppStoreListingBySlug(slug);
    let listingId: string;

    if (existingListing) {
        listingId = existingListing.listing_id;

        // Re-point kind/status so a slug previously seeded as an APP listing becomes
        // plannable instead of failing the planner's signed-manifest requirement.
        await neogma.queryRunner.run(
            `MATCH (l:AppStoreListing { listing_id: $listingId })
             SET l.kind               = 'INTEGRATION',
                 l.app_listing_status = 'LISTED',
                 l.display_name       = $displayName,
                 l.tagline            = $tagline,
                 l.full_description   = $fullDescription,
                 l.category           = $listingCategory,
                 l.launch_type        = 'SERVER_HEADLESS',
                 l.launch_config_json = $launchConfigJson`,
            {
                listingId,
                displayName: appName,
                tagline: `Dev ${category} integration`,
                fullDescription: `Locally seeded ${category} integration published by ${publisherDid}`,
                listingCategory: 'Integrations',
                launchConfigJson: JSON.stringify({ connectUrl }),
            }
        );

        console.log(`  Listing:             ${listingId} (repaired → INTEGRATION/LISTED)`);
    } else {
        const listing = await createAppStoreListing({
            slug,
            kind: 'INTEGRATION',
            display_name: appName,
            tagline: `Dev ${category} integration`,
            full_description: `Locally seeded ${category} integration published by ${publisherDid}`,
            icon_url: 'https://placehold.co/250x250/teal/white?text=Integration',
            app_listing_status: 'LISTED',
            launch_type: 'SERVER_HEADLESS',
            launch_config_json: JSON.stringify({ connectUrl }),
            category: 'Integrations',
            promotion_level: 'STANDARD',
        });

        listingId = listing.listing_id;

        console.log(`  Listing:             ${listingId} (created)`);
    }

    const existingIntegration = await neogma.queryRunner.run(
        `MATCH (i:Integration)-[:PUBLISHES_LISTING]->(:AppStoreListing { listing_id: $listingId })
         RETURN i.id AS integrationId
         LIMIT 1`,
        { listingId }
    );
    const existingIntegrationId = existingIntegration.records[0]?.get('integrationId') as
        string | undefined;

    if (existingIntegrationId) {
        console.log(`  Integration node:    ${existingIntegrationId} (exists)`);
    } else {
        const integration = await createIntegration({
            name: `${appName} Integration`,
            description: `Integration for ${appName}`,
            whitelistedDomains: ['localhost', 'localhost:4321'],
        } as Parameters<typeof createIntegration>[0]);

        await associateIntegrationWithProfile(integration.id, ownerProfileId);
        await associateListingWithIntegration(listingId, integration.id);

        console.log(`  Integration node:    ${integration.id} (created)`);
    }

    const unsignedManifest: Omit<IntegrationManifest, 'signature'> = {
        apiVersion: apiVersion as IntegrationManifest['apiVersion'],
        id: manifestId,
        version: manifestVersion,
        listingKind: 'INTEGRATION',
        publisherDid,
        category: category as IntegrationManifest['category'],
        scopes: [
            {
                resource: 'group',
                action: 'sync',
                selectorKind: 'tree',
                selectorValue: '$installEcosystemId',
                reason: `Sync ${category} data for the installing ecosystem`,
            },
        ] as IntegrationManifest['scopes'],
        consentRequirements: consentRequirements as IntegrationManifest['consentRequirements'],
        capabilities: {
            provided: provided as IntegrationManifest['capabilities']['provided'],
            consumed: consumed as IntegrationManifest['capabilities']['consumed'],
        },
        supportedRecordClasses: recordClasses as IntegrationManifest['supportedRecordClasses'],
        extensionPoints: [],
        subscribes,
        consoleSurfaces,
        endpoints: { healthUrl, connectUrl },
    };

    const manifest = await signManifestWithDidKey<IntegrationManifest>(
        unsignedManifest,
        publisherSeed
    );
    const manifestJson = JSON.stringify(manifest);

    console.log(`  Manifest signed:     ${manifest.signature.alg}`);

    const existingVersionResult = await neogma.queryRunner.run(
        `MATCH (:AppStoreListing { listing_id: $listingId })-[:HAS_VERSION]->(v:ListingVersion { version: $version })
         RETURN v.version_id AS versionId
         LIMIT 1`,
        { listingId, version: manifestVersion }
    );
    const existingVersionId = existingVersionResult.records[0]?.get('versionId') as
        string | undefined;

    let versionId: string;

    if (existingVersionId) {
        versionId = existingVersionId;

        // createListingVersion refuses to touch an existing version (they are immutable
        // in production), so re-signing in place is the only way this stays idempotent
        // against a version left behind by an earlier unsigned seed.
        await neogma.queryRunner.run(
            `MATCH (v:ListingVersion { version_id: $versionId })
             SET v.status        = 'LISTED',
                 v.manifest_json = $manifestJson,
                 v.manifest_hash = $manifestHash,
                 v.publisher_did = $publisherDid,
                 v.signature     = $signature`,
            {
                versionId,
                manifestJson,
                manifestHash: computeManifestHash(manifest),
                publisherDid,
                signature: manifest.signature.sig,
            }
        );

        console.log(`  ListingVersion:      ${versionId} (re-signed → LISTED)`);
    } else {
        const created = await createListingVersion(listingId, {
            version: manifestVersion,
            status: 'LISTED',
            manifest_json: manifestJson,
        });

        versionId = created.version_id;

        console.log(`  ListingVersion:      ${versionId} (created)`);
    }

    if (ecosystemId) {
        const { ensureEcosystemWithId } = await import('../test/helpers/education-os.helpers');
        const { grantEcosystemMembership } = await import('@accesslayer/ecosystem/membership');

        await ensureEcosystemWithId({
            ecosystemId,
            slug: slugify(ecosystemId),
            name: 'Dev Root Ecosystem',
            ownerProfileId,
        });
        await grantEcosystemMembership({ profileId: ownerProfileId, ecosystemId, role: 'OWNER' });

        console.log(`  Ecosystem:           ${ecosystemId} (${ownerProfileId} → OWNER)`);
    }

    // Same guard sequence buildSpecForIntent runs before it will plan an install.
    const listing = await readAppStoreListingById(listingId);
    const version = await readListingVersionById(versionId);

    if (!listing || !version) throw new Error('Seeded listing or version could not be read back.');

    if (listing.app_listing_status !== 'LISTED' || version.status !== 'LISTED') {
        throw new Error('Seeded listing and version must both be LISTED.');
    }

    if (!listingKindRequiresSignedManifest(listing.kind)) {
        throw new Error(`Seeded listing kind ${listing.kind} does not require a signed manifest.`);
    }

    const validated = await assertSignedListingVersionOrThrow(listing.kind, version);

    console.log(`
✅ Done! Seed summary:
──────────────────────────────────────────────────
  listing_id:      ${listingId}
  version_id:      ${versionId}
  slug:            ${slug}
  kind:            ${listing.kind} (${listing.app_listing_status})
  version status:  ${version.status}
  manifest id:     ${validated.id}@${validated.version} (${manifest.apiVersion})
  category:        ${manifest.category}
  capabilities:    provided=[${provided.join(', ')}] consumed=[${consumed.join(', ')}]
  publisher DID:   ${version.publisher_did}
  manifest hash:   ${version.manifest_hash}
  signature alg:   ${manifest.signature.alg}
  verification:    ${manifest.signature.verificationMethod}
  owner profile:   ${ownerProfileId}
──────────────────────────────────────────────────
  Manifest validation (assertSignedListingVersionOrThrow): PASS
──────────────────────────────────────────────────

Paste the listing_id and version_id into the console's "Render a new plan" form.
`);

    await neogma.driver.close();
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    });
