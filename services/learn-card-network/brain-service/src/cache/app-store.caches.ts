import { getLRUCache } from '@cache/in-memory-lru';
import { readAppStoreListingById } from '@accesslayer/app-store-listing/read';
import {
    getIntegrationForListing,
    getBoostForListingByTemplateAlias,
} from '@accesslayer/app-store-listing/relationships/read';
import { getOwnerProfileForIntegration } from '@accesslayer/integration/relationships/read';
import {
    getPrimarySigningAuthorityForListing,
    getPrimarySigningAuthorityForIntegration,
} from '@accesslayer/signing-authority/relationships/read';
import type { AppStoreListingType } from 'types/app-store-listing';

// LC-1644: in-memory LRU caches for the hot handleSendCredentialEvent path.
//
// Each cached entity is keyed by its fetch arguments. TTL is intentionally short
// (30s) so edits to a boost template / listing / SA propagate quickly without
// needing manual invalidation on every write site. A warm lambda instance
// serving bursty traffic will hit these caches the vast majority of the time;
// cold lambdas miss once per entity then warm up.
//
// Staleness budget: ≤30s. If tighter consistency is required (e.g. immediate
// cache bust after a boost edit), the write-side code should call the relevant
// `invalidate*` function. That wiring is deliberately NOT added here to keep
// the PR surface small — followup work if production metrics show stale reads.
const BOOST_CACHE_TTL_MS = 30_000;
const LISTING_CACHE_TTL_MS = 30_000;
const INTEGRATION_CACHE_TTL_MS = 30_000;
const OWNER_CACHE_TTL_MS = 30_000;
const SA_CACHE_TTL_MS = 30_000;

const boostByAliasCache =
    getLRUCache<Awaited<ReturnType<typeof getBoostForListingByTemplateAlias>>>(200);
const listingByIdCache = getLRUCache<Awaited<ReturnType<typeof readAppStoreListingById>>>(200);
const integrationByListingCache =
    getLRUCache<Awaited<ReturnType<typeof getIntegrationForListing>>>(200);
const ownerByIntegrationCache =
    getLRUCache<Awaited<ReturnType<typeof getOwnerProfileForIntegration>>>(200);
const listingSaCache =
    getLRUCache<Awaited<ReturnType<typeof getPrimarySigningAuthorityForListing>>>(200);
const integrationSaCache =
    getLRUCache<Awaited<ReturnType<typeof getPrimarySigningAuthorityForIntegration>>>(200);

export const getBoostForListingCached = async (
    listingId: string,
    templateAlias: string,
    domain: string
) => {
    const key = `${listingId}|${templateAlias}|${domain}`;
    const hit = boostByAliasCache.get(key);
    if (hit !== undefined) return hit;
    const value = await getBoostForListingByTemplateAlias(listingId, templateAlias, domain);
    boostByAliasCache.add(key, value, BOOST_CACHE_TTL_MS);
    return value;
};

export const readAppStoreListingByIdCached = async (listingId: string) => {
    const hit = listingByIdCache.get(listingId);
    if (hit !== undefined) return hit;
    const value = await readAppStoreListingById(listingId);
    listingByIdCache.add(listingId, value, LISTING_CACHE_TTL_MS);
    return value;
};

export const getIntegrationForListingCached = async (listingId: string) => {
    const hit = integrationByListingCache.get(listingId);
    if (hit !== undefined) return hit;
    const value = await getIntegrationForListing(listingId);
    integrationByListingCache.add(listingId, value, INTEGRATION_CACHE_TTL_MS);
    return value;
};

export const getOwnerProfileForIntegrationCached = async (integrationId: string) => {
    const hit = ownerByIntegrationCache.get(integrationId);
    if (hit !== undefined) return hit;
    const value = await getOwnerProfileForIntegration(integrationId);
    ownerByIntegrationCache.add(integrationId, value, OWNER_CACHE_TTL_MS);
    return value;
};

export const getPrimarySigningAuthorityForListingCached = async (listing: AppStoreListingType) => {
    const key = listing.listing_id;
    const hit = listingSaCache.get(key);
    if (hit !== undefined) return hit;
    const value = await getPrimarySigningAuthorityForListing(listing);
    listingSaCache.add(key, value, SA_CACHE_TTL_MS);
    return value;
};

export const getPrimarySigningAuthorityForIntegrationCached = async (integrationId: string) => {
    const hit = integrationSaCache.get(integrationId);
    if (hit !== undefined) return hit;
    const value = await getPrimarySigningAuthorityForIntegration(integrationId);
    integrationSaCache.add(integrationId, value, SA_CACHE_TTL_MS);
    return value;
};
