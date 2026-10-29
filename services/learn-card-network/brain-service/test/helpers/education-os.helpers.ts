/**
 * Shared EducationOS (ADR-008) fixture builders.
 *
 * Used by: test/education-os-fixtures.spec.ts and scripts/seed-education-os.ts.
 *
 * These go through the real access layer rather than raw Cypher so a fixture can
 * never be shaped in a way the production readers reject. The spec above is what
 * keeps this file honest: if a Phase A/B schema change makes these fixtures
 * unplannable, the suite fails instead of dev data silently rotting.
 */

import { createProfile } from '@accesslayer/profile/create';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { grantEcosystemMembership } from '@accesslayer/ecosystem/membership';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { readAppStoreListingById } from '@accesslayer/app-store-listing/read';
import { readListingVersionById } from '@accesslayer/listing-version/read';
import { ListingVersion } from '@models';
import { neogma } from '@instance';
import { createSignedListingVersionForKind } from './manifest.helpers';
import type { EcosystemRole } from '@learncard/types';

import { makeListingInput } from './app-store.helpers';
import { ensureEcosystemWithId } from './ecosystem-with-id';

export { ensureEcosystemWithId };

export type PlannableAppFixture = {
    ecosystemId: string;
    operatorProfileId: string;
    operatorRole: EcosystemRole;
    listingId: string;
    versionId: string;
};

export type SeedPlannableAppInput = {
    ecosystemId: string;
    ecosystemSlug?: string;
    ecosystemName?: string;
    operatorProfileId: string;
    operatorDid: string;
    operatorRole?: EcosystemRole;
    listingId: string;
    versionId: string;
    listingKind?: 'APP' | 'INTEGRATION' | 'WALLET' | 'BUNDLE';
    versionNumber?: string;
    manifest?: Record<string, unknown>;
};

export const ensureProfile = async (profileId: string, did: string): Promise<void> => {
    if (await getProfileByProfileId(profileId)) return;

    await createProfile({ profileId, did, displayName: profileId } as Parameters<
        typeof createProfile
    >[0]);
};

export const ensureListedListing = async (input: {
    listingId: string;
    kind: 'APP' | 'INTEGRATION' | 'WALLET' | 'BUNDLE';
}): Promise<string> => {
    const existing = await readAppStoreListingById(input.listingId);

    if (existing) {
        await neogma.queryRunner.run(
            `MATCH (l:AppStoreListing { listing_id: $listingId })
             SET l.kind = $kind, l.app_listing_status = 'LISTED'`,
            input
        );

        return input.listingId;
    }

    await createAppStoreListing(
        makeListingInput({
            listing_id: input.listingId,
            kind: input.kind,
            app_listing_status: 'LISTED',
        })
    );

    return input.listingId;
};

export const ensureListedVersion = async (input: {
    listingId: string;
    versionId: string;
    versionNumber: string;
    manifest?: Record<string, unknown>;
    listingKind?: 'APP' | 'INTEGRATION' | 'WALLET' | 'BUNDLE';
}): Promise<string> => {
    const existing = await readListingVersionById(input.versionId);

    if (!existing) {
        if (input.listingKind && input.listingKind !== 'APP') {
            await createSignedListingVersionForKind({
                listingId: input.listingId,
                kind: input.listingKind,
                versionId: input.versionId,
                version: input.versionNumber,
                status: 'LISTED',
                manifestOverrides: input.manifest,
            });
        } else {
            await ListingVersion.createOne({
                version_id: input.versionId,
                version: input.versionNumber,
                status: 'LISTED',
                manifest_json: JSON.stringify(input.manifest ?? { ok: true }),
                created_at: new Date().toISOString(),
            } as Parameters<typeof ListingVersion.createOne>[0]);
        }
    } else {
        await neogma.queryRunner.run(
            `MATCH (v:ListingVersion { version_id: $versionId }) SET v.status = 'LISTED'`,
            { versionId: input.versionId }
        );
    }

    await neogma.queryRunner.run(
        `MATCH (l:AppStoreListing { listing_id: $listingId })
         MATCH (v:ListingVersion { version_id: $versionId })
         MERGE (l)-[:HAS_VERSION]->(v)`,
        { listingId: input.listingId, versionId: input.versionId }
    );

    return input.versionId;
};

/**
 * Idempotent: safe to re-run against an existing dev database.
 *
 * The operator role is granted here rather than through JIT because ADR-001 §3.10
 * forbids JIT/import flows from ever granting OWNER/ADMIN. This is the explicit
 * administrative grant that authority is supposed to come from.
 */
export const seedPlannableApp = async (
    input: SeedPlannableAppInput
): Promise<PlannableAppFixture> => {
    const operatorRole: EcosystemRole = input.operatorRole ?? 'OWNER';
    const listingKind = input.listingKind ?? 'APP';

    await ensureProfile(input.operatorProfileId, input.operatorDid);

    const ecosystemId = await ensureEcosystemWithId({
        ecosystemId: input.ecosystemId,
        slug: input.ecosystemSlug ?? input.ecosystemId.replace(/[^a-z0-9-]/gi, '-'),
        name: input.ecosystemName ?? 'Dev Root Ecosystem',
        ownerProfileId: input.operatorProfileId,
    });

    await grantEcosystemMembership({
        profileId: input.operatorProfileId,
        ecosystemId,
        role: operatorRole,
    });

    const listingId = await ensureListedListing({ listingId: input.listingId, kind: listingKind });

    const versionId = await ensureListedVersion({
        listingId,
        versionId: input.versionId,
        versionNumber: input.versionNumber ?? '1.0.0',
        listingKind,
        manifest: input.manifest,
    });

    return {
        ecosystemId,
        operatorProfileId: input.operatorProfileId,
        operatorRole,
        listingId,
        versionId,
    };
};

export const DEV_PLANNABLE_APP_FIXTURE = {
    ecosystemId: 'eco_dev_root',
    ecosystemSlug: 'eco-dev-root',
    ecosystemName: 'Dev Root Ecosystem',
    listingId: 'listing_dev_plannable_app',
    versionId: 'version_dev_plannable_app_1_0_0',
} as const;
