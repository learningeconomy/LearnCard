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

export type CatalogPolicyLevel = {
    ecosystemId: string;
    policy: CatalogPolicySnapshot;
};

/** Policies along the ecosystem path, root first; descendants may restrict, never widen. */
export const getCatalogPolicyLevels = async (
    ecosystemId: string
): Promise<CatalogPolicyLevel[]> => {
    const ecosystem = await getEcosystemById(ecosystemId);

    if (!ecosystem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });
    }

    const pathIds = ecosystem.pathIds.length > 0 ? ecosystem.pathIds : [ecosystemId];

    return Promise.all(
        pathIds.map(async id => ({ ecosystemId: id, policy: await getCatalogPolicySnapshot(id) }))
    );
};

export const getCatalogPolicyRevision = async (ecosystemId: string): Promise<string> => {
    const levels = await getCatalogPolicyLevels(ecosystemId);

    // A root keeps its single-snapshot hash so existing intents stay valid; nested ecosystems
    // hash every level so an ancestor's change invalidates descendant approvals.
    if (levels.length === 1) return computeStableHash(levels[0]!.policy);

    return computeStableHash(levels);
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

const isListingAllowedAtLevel = async (
    level: CatalogPolicyLevel,
    listingId: string
): Promise<boolean> => {
    if (level.policy.allowedListings && !level.policy.allowedListings.includes(listingId)) {
        return false;
    }

    if (level.policy.requireEndorsement) {
        return isListingEndorsedForEcosystem(level.ecosystemId, listingId);
    }

    return true;
};

export const isListingAllowedByCatalogPolicy = async (
    ecosystemId: string,
    listingId: string
): Promise<boolean> => {
    const levels = await getCatalogPolicyLevels(ecosystemId);

    for (const level of levels) {
        if (!(await isListingAllowedAtLevel(level, listingId))) return false;
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
    const levels = await getCatalogPolicyLevels(ecosystemId);
    const entries = await Promise.all(
        listings.map(async listing => {
            for (const level of levels) {
                if (!(await isListingAllowedAtLevel(level, listing.listing_id))) {
                    return { listing, allowed: false };
                }
            }

            return { listing, allowed: true };
        })
    );

    return entries.filter(entry => entry.allowed).map(entry => entry.listing);
};
