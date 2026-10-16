#!/usr/bin/env bun
/**
 * Dev-only signed wallet catalog fixtures. Run: bun run seed:dev-wallets
 * Prerequisites: bun run dev-console stack up, Neo4j reachable via NEO4J_*.
 * Bun is required for the access layer's circular imports. Like the sibling dev
 * seeds, re-runs repair existing versions in place (not a production publication flow).
 * These dev signatures and illustrative endpoints are not production endorsements.
 */
import * as dotenv from 'dotenv';
import type { WalletManifest } from '@learncard/types';

dotenv.config();
process.env.NEO4J_URI ??= 'bolt://localhost:7687';
process.env.NEO4J_USERNAME ??= 'neo4j';
process.env.NEO4J_PASSWORD ??= 'password';
process.env.DOMAIN_NAME ??= 'localhost%3A4000';

const main = async (): Promise<void> => {
    if (process.env.NODE_ENV === 'production') throw new Error('Wallet fixtures are dev-only.');
    const { neogma } = await import('@instance');
    try {
        const { getLearnCard } = await import('@helpers/learnCard.helpers');
        const { signManifestWithDidKey, computeManifestHash, assertSignedListingVersionOrThrow } =
            await import('@helpers/manifest-signature.helpers');
        const { createProfile } = await import('@accesslayer/profile/create');
        const { getProfileByProfileId } = await import('@accesslayer/profile/read');
        const { createAppStoreListing } = await import('@accesslayer/app-store-listing/create');
        const { readAppStoreListingBySlug } = await import('@accesslayer/app-store-listing/read');
        const { updateAppStoreListing } = await import('@accesslayer/app-store-listing/update');
        const { createIntegration } = await import('@accesslayer/integration/create');
        const { createListingVersion } = await import('@accesslayer/listing-version/create');
        const { readListingVersionsForListing, readListingVersionById } =
            await import('@accesslayer/listing-version/read');
        const publisherSeed = 'a'.repeat(64);
        const publisherDid = (await getLearnCard(publisherSeed)).id.did();
        const ownerProfileId = 'dev-owner';
        if (!(await getProfileByProfileId(ownerProfileId))) {
            await createProfile({
                profileId: ownerProfileId,
                did: `did:seed:${ownerProfileId}`,
                displayName: 'Dev Owner',
                shortBio: 'Dev seed profile',
                bio: '',
            });
        }
        for (const wallet of [
            {
                slug: 'learncard-wallet',
                name: 'LearnCard',
                domain: 'learncard.app',
                tagline: 'The LearnCard wallet for learners',
            },
            {
                slug: 'vetpass-wallet',
                name: 'VetPass',
                domain: 'vetpass.app',
                tagline: 'A wallet for veterans’ credentials and achievements',
            },
        ]) {
            const baseUrl = `https://${wallet.domain}`;
            const unsigned: Omit<WalletManifest, 'signature'> = {
                apiVersion: 'lc.wallet/v1',
                id: `com.learncard.dev.${wallet.slug}`,
                version: '1.0.0',
                listingKind: 'WALLET',
                walletName: wallet.name,
                publisherDid,
                provides: ['wallet-claim'],
                platforms: ['web', 'ios', 'android'],
                claimProtocols: ['oid4vci', 'deep-link'],
                supportsApps: true,
                endpoints: {
                    claimUrl: `${baseUrl}/claim`,
                    inviteUrl: baseUrl,
                    healthUrl: `${baseUrl}/health`,
                },
            };
            const manifest = await signManifestWithDidKey<WalletManifest>(unsigned, publisherSeed);
            const fields = {
                slug: wallet.slug,
                kind: 'WALLET' as const,
                display_name: wallet.name,
                tagline: wallet.tagline,
                full_description: `${wallet.tagline}. Local dev catalog fixture.`,
                icon_url: `${baseUrl}/favicon.ico`,
                app_listing_status: 'LISTED' as const,
                launch_type: 'SERVER_HEADLESS' as const,
                launch_config_json: JSON.stringify({ url: baseUrl }),
                category: 'Wallets',
                promotion_level: 'STANDARD' as const,
            };
            const existing = await readAppStoreListingBySlug(wallet.slug);
            const listing = existing ?? (await createAppStoreListing(fields));
            if (existing) await updateAppStoreListing(existing, fields);

            const publisher = await neogma.queryRunner.run(
                `MATCH (i:Integration)-[:PUBLISHES_LISTING]->(:AppStoreListing {listing_id: $id})
                 RETURN i.id AS id LIMIT 1`,
                { id: listing.listing_id }
            );
            const integrationId = publisher.records[0]?.get('id');
            const ownerIntegrationId =
                typeof integrationId === 'string'
                    ? integrationId
                    : (
                          await createIntegration({
                              name: `${wallet.name} Publisher`,
                              description: 'Local dev wallet publisher',
                              whitelistedDomains: [wallet.domain],
                          })
                      ).id;
            await neogma.queryRunner.run(
                `MATCH (i:Integration {id: $integrationId}), (p:Profile {profileId: $ownerProfileId}),
                       (l:AppStoreListing {listing_id: $listingId})
                 MERGE (i)-[:CREATED_BY]->(p)
                 MERGE (i)-[:PUBLISHES_LISTING]->(l)`,
                { integrationId: ownerIntegrationId, ownerProfileId, listingId: listing.listing_id }
            );

            const previous = (await readListingVersionsForListing(listing.listing_id)).find(
                version => version.version === manifest.version
            );
            const manifestJson = JSON.stringify(manifest);
            const versionId =
                previous?.version_id ??
                (
                    await createListingVersion(listing.listing_id, {
                        version: manifest.version,
                        status: 'LISTED',
                        manifest_json: manifestJson,
                    })
                ).version_id;
            if (previous) {
                await neogma.queryRunner.run(
                    `MATCH (v:ListingVersion {version_id: $versionId})
                     SET v.status = 'LISTED', v.manifest_json = $manifestJson,
                         v.manifest_hash = $hash, v.publisher_did = $publisherDid,
                         v.signature = $signature`,
                    {
                        versionId,
                        manifestJson,
                        hash: computeManifestHash(manifest),
                        publisherDid,
                        signature: manifest.signature.sig,
                    }
                );
            }
            const version = await readListingVersionById(versionId);
            if (!version) throw new Error(`Missing wallet version: ${wallet.slug}`);
            await assertSignedListingVersionOrThrow('WALLET', version);
            console.log(
                `${wallet.slug}: WALLET / LISTED / signed manifest verified (${versionId})`
            );
        }
    } finally {
        await neogma.driver.close();
    }
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Wallet seed failed:', error);
        process.exit(1);
    });
