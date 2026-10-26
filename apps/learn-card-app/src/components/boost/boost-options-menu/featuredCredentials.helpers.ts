import { UnsignedVC, VC } from '@learncard/types';

import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { LCR } from 'learn-card-base/types/credential-records';

/** The network profile accepts at most this many featured credential URIs. */
export const MAX_FEATURED_CREDENTIALS = 5;

/**
 * The URI that identifies an earned credential on the public profile.
 *
 * `highlightedCredentials` stores boost URIs: they are signed, publicly resolvable claims,
 * while the record's own `uri` is an encrypted storage locator only the holder can read.
 * Credentials without a boost URI cannot be featured.
 */
export const getFeaturableCredentialUri = (
    credential?: VC | UnsignedVC,
    record?: Partial<LCR>
): string | undefined => {
    const boostUri =
        credential?.boostId ?? unwrapBoostCredential(credential)?.boostId ?? record?.boostUri;

    return typeof boostUri === 'string' && boostUri.length > 0 ? boostUri : undefined;
};

export const isCredentialFeatured = (featuredUris: readonly string[], uri: string): boolean =>
    featuredUris.includes(uri);

export const hasFeaturedCapacity = (featuredUris: readonly string[]): boolean =>
    featuredUris.length < MAX_FEATURED_CREDENTIALS;

/**
 * Appends `uri` to the ordered selection. Existing order is preserved and an already
 * featured URI is left in place. Returns `undefined` when the selection is full.
 */
export const addFeaturedCredential = (
    featuredUris: readonly string[],
    uri: string
): string[] | undefined => {
    if (isCredentialFeatured(featuredUris, uri)) return [...featuredUris];
    if (!hasFeaturedCapacity(featuredUris)) return undefined;

    return [...featuredUris, uri];
};

/** Removes `uri` from the ordered selection, keeping the remaining order intact. */
export const removeFeaturedCredential = (featuredUris: readonly string[], uri: string): string[] =>
    featuredUris.filter(featuredUri => featuredUri !== uri);
