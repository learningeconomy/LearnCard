/** Prefix used for signing authorities created for developer-portal apps */
export const APP_SIGNING_AUTHORITY_PREFIX = 'app-';

type RegisteredSigningAuthority = {
    signingAuthority?: { endpoint?: string };
    relationship?: { name?: string; isPrimary?: boolean; did?: string };
};

/**
 * Picks a user-owned signing authority for user-initiated flows (e.g. boost claim links).
 *
 * App-owned signing authorities (created by the developer portal with the `app-` prefix)
 * are registered on the user's profile but are keyed by the app's DID in the LCA-API,
 * so user-shared boosts must not sign with them — the credential would be issued under
 * the app's identity (LC-1942). Prefers the primary user-owned SA, then the first one.
 */
export const pickUserOwnedSigningAuthority = <T extends RegisteredSigningAuthority>(
    rsas: T[] | undefined | null
): T | undefined => {
    const userOwned = (rsas ?? []).filter(
        rsa => !rsa?.relationship?.name?.startsWith(APP_SIGNING_AUTHORITY_PREFIX)
    );

    return userOwned.find(rsa => rsa?.relationship?.isPrimary) ?? userOwned[0];
};
