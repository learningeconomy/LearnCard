import { TRPCError } from '@trpc/server';

import type { AppStoreListingType } from 'types/app-store-listing';
import { neogma } from '@instance';
import { getEcosystemById } from '@accesslayer/ecosystem/read';
import { computeStableHash } from '@helpers/install-intent.helpers';

export type CatalogPolicySnapshot = {
    allowedListings?: string[];
    requireEndorsement: boolean;
};

export const normalizeCatalogPolicySnapshot = (
    policy: CatalogPolicySnapshot
): CatalogPolicySnapshot => {
    const allowedListings = policy.allowedListings
        ? Array.from(new Set(policy.allowedListings)).sort()
        : undefined;

    return {
        allowedListings,
        requireEndorsement: Boolean(policy.requireEndorsement),
    };
};

export const getCatalogPolicySnapshot = async (
    ecosystemId: string
): Promise<CatalogPolicySnapshot> => {
    const ecosystem = await getEcosystemById(ecosystemId);

    if (!ecosystem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });
    }

    const settings = ecosystem.settings as {
        catalogPolicy?: {
            allowedListings?: string[];
            requireEndorsement?: boolean;
        };
    };

    return normalizeCatalogPolicySnapshot({
        allowedListings: settings.catalogPolicy?.allowedListings,
        requireEndorsement: settings.catalogPolicy?.requireEndorsement ?? false,
    });
};

export const getCatalogPolicyRevision = async (ecosystemId: string): Promise<string> => {
    const policy = await getCatalogPolicySnapshot(ecosystemId);

    return computeStableHash(policy);
};

export const isListingEndorsedForEcosystem = async (
    ecosystemId: string,
    listingId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Ecosystem { id: $ecosystemId })-[:ENDORSES]->(:AppStoreListing { listing_id: $listingId })
         RETURN COUNT(*) > 0 AS endorsed`,
        { ecosystemId, listingId }
    );

    return Boolean(result.records[0]?.get('endorsed'));
};

export const isListingAllowedByCatalogPolicy = async (
    ecosystemId: string,
    listingId: string
): Promise<boolean> => {
    const policy = await getCatalogPolicySnapshot(ecosystemId);

    if (policy.allowedListings && !policy.allowedListings.includes(listingId)) {
        return false;
    }

    if (policy.requireEndorsement) {
        return isListingEndorsedForEcosystem(ecosystemId, listingId);
    }

    return true;
};

export const assertListingAllowedByCatalogPolicy = async (
    ecosystemId: string,
    listing: Pick<AppStoreListingType, 'listing_id'>
): Promise<void> => {
    const allowed = await isListingAllowedByCatalogPolicy(ecosystemId, listing.listing_id);

    if (!allowed) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Listing is disallowed by ecosystem catalog policy.',
        });
    }
};

export const filterListingsByCatalogPolicy = async (
    ecosystemId: string,
    listings: AppStoreListingType[]
): Promise<AppStoreListingType[]> => {
    const policy = await getCatalogPolicySnapshot(ecosystemId);
    const allowedListingSet = policy.allowedListings ? new Set(policy.allowedListings) : undefined;
    const scopedListings = allowedListingSet
        ? listings.filter(listing => allowedListingSet.has(listing.listing_id))
        : listings;

    if (!policy.requireEndorsement) {
        return scopedListings;
    }

    const visibilityEntries = await Promise.all(
        scopedListings.map(async listing => ({
            listing,
            endorsed: await isListingEndorsedForEcosystem(ecosystemId, listing.listing_id),
        }))
    );

    return visibilityEntries.filter(entry => entry.endorsed).map(entry => entry.listing);
};
