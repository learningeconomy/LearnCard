import { createHash } from 'node:crypto';

/** did:web method-specific-id characters we pass through untouched. */
const DID_SAFE = /^[A-Za-z0-9._-]+$/;

/**
 * The HCP Context Client DID an OAuth client acts as: keyless and stable, derived from
 * the AS issuer's host and the registered `client_id`.
 *
 *   did:web:<issuer host, port as %3A>:hcp:oauth-clients:<client_id>
 *
 * The client never signs: the AS mints its access tokens, and grants hold this DID
 * only as an identifier, so no DID document is served. AS-issued ids
 * (`hcp_oauth_<hex>`) are DID-safe; any other id is replaced by
 * base64url(sha256(client_id)) so the DID stays well formed.
 */
export const deriveOAuthClientDid = (issuerUrl: string, clientId: string): string => {
    const host = new URL(issuerUrl).host.toLowerCase().replace(/:/g, '%3A');
    const id = DID_SAFE.test(clientId)
        ? clientId
        : createHash('sha256').update(clientId).digest('base64url');
    return `did:web:${host}:hcp:oauth-clients:${id}`;
};
