#!/usr/bin/env bun
/**
 * Seed a BUNDLE-kind App Store listing whose ListingVersion carries a real,
 * cryptographically signed `lc.bundle` manifest — one `expandBundle` and the
 * install-intent planner (`assertSignedListingVersionOrThrow`) accept.
 *
 * BUNDLE is a signed-manifest kind (`listingKindRequiresSignedManifest` returns true for
 * INTEGRATION, WALLET and BUNDLE), so the fixture is signed exactly like
 * `seed:dev-integration` signs its `lc.integration` manifest — see that script's header
 * for the canonicalization/JWS details, they are identical here.
 *
 * The bundle's members point at the *other* dev listings by (listingId, versionId).
 * Members that do not have a LISTED ListingVersion yet get one minted first, signed when
 * their kind requires it, so every member reference in the manifest resolves to a real
 * version node rather than a dangling id.
 *
 * Run with bun, not tsx: the access layer's circular imports only resolve under bun's
 * ESM loader, which is what lets this reuse the production signing helper
 * (`signManifestWithDidKey`) instead of hand-rolling JWS in raw Cypher.
 *
 *   bun run seed:dev-bundle
 *   bun run seed:dev-bundle --slug early-learning-starter --version 1.0.0
 *   bun run seed:dev-bundle --members dev-integration,learncard-wallet,dev-partner-app
 *   bun run seed:dev-bundle --ecosystem eco_dev_root
 *
 * Idempotent: re-running repairs the fixture (relisting, re-signing a stale or unsigned
 * manifest, re-pointing members) rather than duplicating it.
 */

import * as dotenv from 'dotenv';

import type {
    BundleManifest,
    BundleManifestMember,
    InstallTargetType,
    IntegrationManifest,
    WalletManifest,
} from '@learncard/types';

dotenv.config();

// src/instance.ts requires NEO4J_* with no defaults, but the sibling dev scripts
// (seed-dev-app, seed-dev-integration) default to a local Neo4j. Match them so this
// works from a clean checkout without a .env.
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

const listArg = (name: string, fallback: string[]): string[] => {
    const raw = arg(name, '');

    return raw
        ? raw
              .split(',')
              .map(entry => entry.trim())
              .filter(Boolean)
        : fallback;
};

const slugify = (raw: string): string =>
    raw
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

// ADR-008 install targets: the manifest declares what each member materializes as, which
// is derived from the member listing's kind rather than restated by hand.
const TARGET_TYPE_BY_KIND: Record<string, InstallTargetType> = {
    INTEGRATION: 'INTEGRATION_INSTALL',
    APP: 'APP_AVAILABILITY',
    WALLET: 'WALLET_ENABLEMENT',
};

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
    const { expandBundle } = await import('@helpers/install-intent.helpers');
    const { createProfile } = await import('@accesslayer/profile/create');
    const { getProfileByProfileId } = await import('@accesslayer/profile/read');
    const { createAppStoreListing } = await import('@accesslayer/app-store-listing/create');
    const { readAppStoreListingById, readAppStoreListingBySlug } = await import(
        '@accesslayer/app-store-listing/read'
    );
    const { createListingVersion } = await import('@accesslayer/listing-version/create');
    const { readListingVersionById, readListingVersionsForListing } = await import(
        '@accesslayer/listing-version/read'
    );

    const bundleName = arg('bundle-name', 'Early Learning Starter');
    const slug = arg('slug', slugify(bundleName));
    const ownerProfileId = arg('profile', 'dev-owner').toLowerCase().replace(/:/g, '%3A');
    const publisherSeed = arg('publisher-seed', 'b'.repeat(64));
    const memberPublisherSeed = arg('member-publisher-seed', 'a'.repeat(64));
    const manifestId = arg('bundle-id', `com.learncard.dev.${slug.replace(/-/g, '.')}`);
    const manifestVersion = arg('version', '1.0.0');
    const memberSlugs = listArg('members', [
        'dev-integration',
        'learncard-wallet',
        'dev-partner-app',
    ]);
    const ecosystemId = arg('ecosystem', '');

    console.log('\n🔧 Seeding dev BUNDLE listing...\n');

    const publisherLearnCard = await getLearnCard(publisherSeed);
    const publisherDid = publisherLearnCard.id.did();
    const memberLearnCard = await getLearnCard(memberPublisherSeed);
    const memberPublisherDid = memberLearnCard.id.did();

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

    // A bundle manifest pins (listingId, versionId) per member, so every member listing
    // needs a LISTED version before the manifest can reference it. Signed-manifest kinds
    // get a real signed manifest — the seed never fabricates an unsigned one for a kind
    // the planner would reject.
    const ensureMemberVersion = async (listing: {
        listing_id: string;
        slug?: string;
        kind?: string;
        display_name: string;
    }): Promise<{ versionId: string; version: string; minted: boolean }> => {
        const listed = (await readListingVersionsForListing(listing.listing_id)).filter(
            version => version.status === 'LISTED'
        );

        if (listed[0]) {
            return { versionId: listed[0].version_id, version: listed[0].version, minted: false };
        }

        const kind = listing.kind ?? 'APP';
        const memberVersion = '1.0.0';
        let manifestJson: string;

        if (kind === 'WALLET') {
            const unsigned: Omit<WalletManifest, 'signature'> = {
                apiVersion: 'lc.wallet/v1',
                id: `com.learncard.dev.${(listing.slug ?? listing.listing_id).replace(/-/g, '.')}`,
                version: memberVersion,
                listingKind: 'WALLET',
                walletName: listing.display_name,
                publisherDid: memberPublisherDid,
                claimProtocols: ['oid4vci'],
                platforms: ['web'],
                endpoints: { healthUrl: 'http://localhost:3000/health' },
                provides: ['wallet-claim'],
                supportsApps: true,
            };

            manifestJson = JSON.stringify(
                await signManifestWithDidKey<WalletManifest>(unsigned, memberPublisherSeed)
            );
        } else if (kind === 'INTEGRATION') {
            const unsigned: Omit<IntegrationManifest, 'signature'> = {
                apiVersion: 'lc.integration/v1.2',
                id: `com.learncard.dev.${(listing.slug ?? listing.listing_id).replace(/-/g, '.')}`,
                version: memberVersion,
                listingKind: 'INTEGRATION',
                publisherDid: memberPublisherDid,
                category: 'sis',
                scopes: [
                    {
                        resource: 'group',
                        action: 'sync',
                        selectorKind: 'tree',
                        selectorValue: '$installEcosystemId',
                        reason: 'Sync sis data for the installing ecosystem',
                    },
                ] as IntegrationManifest['scopes'],
                consentRequirements: ['directory'],
                capabilities: { provided: ['roster-source'], consumed: [] },
                supportedRecordClasses: ['academic'],
                extensionPoints: [],
                endpoints: { healthUrl: 'http://localhost:4321/health' },
            };

            manifestJson = JSON.stringify(
                await signManifestWithDidKey<IntegrationManifest>(unsigned, memberPublisherSeed)
            );
        } else {
            // APP listings do not carry signed manifests in Phase C — the version node
            // exists purely so the bundle can pin it.
            manifestJson = JSON.stringify({
                apiVersion: 'lc.app/v1',
                id: listing.slug ?? listing.listing_id,
                version: memberVersion,
            });
        }

        const created = await createListingVersion(listing.listing_id, {
            version: memberVersion,
            status: 'LISTED',
            manifest_json: manifestJson,
        });

        return { versionId: created.version_id, version: created.version, minted: true };
    };

    const members: BundleManifestMember[] = [];
    const memberSummaries: string[] = [];

    for (const memberSlug of memberSlugs) {
        const memberListing = await readAppStoreListingBySlug(memberSlug);

        if (!memberListing) {
            throw new Error(
                `Bundle member "${memberSlug}" was not found. Seed it first (seed:dev-app / seed:dev-integration).`
            );
        }

        const targetType = TARGET_TYPE_BY_KIND[memberListing.kind ?? 'APP'];

        if (!targetType) {
            throw new Error(
                `Bundle member "${memberSlug}" has kind ${memberListing.kind} with no install target mapping.`
            );
        }

        const { versionId, version, minted } = await ensureMemberVersion(memberListing);

        members.push({
            declarationId: memberSlug,
            targetType,
            listingId: memberListing.listing_id,
            versionId,
            optional: false,
        });

        memberSummaries.push(
            `${memberSlug} → ${targetType}\n                     listing ${
                memberListing.listing_id
            }\n                     version ${versionId} (${version}, ${
                minted ? 'minted' : 'existing'
            })`
        );

        console.log(
            `  Member:              ${memberSlug} (${memberListing.kind} → ${targetType}) ${
                minted ? '[version minted]' : '[version exists]'
            }`
        );
    }

    const existingListing = await readAppStoreListingBySlug(slug);
    let listingId: string;

    const tagline = arg('tagline', 'Everything an early learning program needs to get started');
    const fullDescription = arg(
        'description',
        `Locally seeded bundle published by ${publisherDid}. Installs ${members.length} catalog items together.`
    );

    if (existingListing) {
        listingId = existingListing.listing_id;

        // Re-point kind/status so a slug previously seeded as an APP listing becomes
        // plannable instead of failing the planner's signed-manifest requirement.
        await neogma.queryRunner.run(
            `MATCH (l:AppStoreListing { listing_id: $listingId })
             SET l.kind               = 'BUNDLE',
                 l.app_listing_status = 'LISTED',
                 l.display_name       = $displayName,
                 l.tagline            = $tagline,
                 l.full_description   = $fullDescription,
                 l.category           = $listingCategory,
                 l.launch_type        = 'SERVER_HEADLESS',
                 l.launch_config_json = $launchConfigJson`,
            {
                listingId,
                displayName: bundleName,
                tagline,
                fullDescription,
                listingCategory: 'Bundles',
                launchConfigJson: JSON.stringify({ members: members.length }),
            }
        );

        console.log(`  Listing:             ${listingId} (repaired → BUNDLE/LISTED)`);
    } else {
        const listing = await createAppStoreListing({
            slug,
            kind: 'BUNDLE',
            display_name: bundleName,
            tagline,
            full_description: fullDescription,
            icon_url: 'https://placehold.co/250x250/violet/white?text=Bundle',
            app_listing_status: 'LISTED',
            launch_type: 'SERVER_HEADLESS',
            launch_config_json: JSON.stringify({ members: members.length }),
            category: 'Bundles',
            promotion_level: 'FEATURED_CAROUSEL',
        });

        listingId = listing.listing_id;

        console.log(`  Listing:             ${listingId} (created)`);
    }

    const unsignedManifest: Omit<BundleManifest, 'signature'> = {
        apiVersion: 'lc.bundle/v1',
        id: manifestId,
        version: manifestVersion,
        publisherDid,
        contains: members,
        defaultBindings: [],
        preflight: [],
    };

    const manifest = await signManifestWithDidKey<BundleManifest>(unsignedManifest, publisherSeed);
    const manifestJson = JSON.stringify(manifest);

    console.log(`  Manifest signed:     ${manifest.signature.alg}`);

    const existingVersionResult = await neogma.queryRunner.run(
        `MATCH (:AppStoreListing { listing_id: $listingId })-[:HAS_VERSION]->(v:ListingVersion { version: $version })
         RETURN v.version_id AS versionId
         LIMIT 1`,
        { listingId, version: manifestVersion }
    );
    const existingVersionId = existingVersionResult.records[0]?.get('versionId') as
        | string
        | undefined;

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
    // Prove the planner's bundle fan-out step accepts the manifest too, not just its
    // signature: expandBundle is what buildSpecForIntent calls for BUNDLE sources.
    const expansion = expandBundle(manifest);

    console.log(`
✅ Done! Seed summary:
──────────────────────────────────────────────────
  listing_id:      ${listingId}
  version_id:      ${versionId}
  slug:            ${slug}
  kind:            ${listing.kind} (${listing.app_listing_status})
  version status:  ${version.status}
  manifest id:     ${validated.id}@${validated.version} (${manifest.apiVersion})
  publisher DID:   ${version.publisher_did}
  manifest hash:   ${version.manifest_hash}
  signature alg:   ${manifest.signature.alg}
  verification:    ${manifest.signature.verificationMethod}
  owner profile:   ${ownerProfileId}
──────────────────────────────────────────────────
  Bundle members (${members.length}):
${memberSummaries.map(summary => `    ${summary}`).join('\n')}
──────────────────────────────────────────────────
  Manifest validation (assertSignedListingVersionOrThrow): PASS
  Bundle expansion (expandBundle): PASS — ${expansion.members.length} member declarations
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
