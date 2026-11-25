/**
 * OAuth Client Storage
 *
 * Manages registered OAuth clients in Redis.
 * Clients must be registered before they can use the OAuth flow.
 */

import cache from '../../utils/cache';

const CLIENT_PREFIX = 'oauth:client:';
const CLIENT_TTL = 60 * 60 * 24 * 365; // 1 year

export interface RegisteredClient {
    client_id: string;
    client_name: string;
    redirect_uris: string[];
    grant_types?: string[];
    response_types?: string[];
    token_endpoint_auth_method?: string;
    created_at?: number;
}

/**
 * Register a new OAuth client
 */
export async function registerClient(client: RegisteredClient): Promise<RegisteredClient> {
    const clientWithTimestamp = {
        ...client,
        created_at: client.created_at || Date.now(),
    };

    await cache.set(
        `${CLIENT_PREFIX}${client.client_id}`,
        JSON.stringify(clientWithTimestamp),
        CLIENT_TTL
    );

    return clientWithTimestamp;
}

/**
 * Get a registered client by ID
 * Returns null if client doesn't exist
 */
export async function getRegisteredClient(clientId: string): Promise<RegisteredClient | null> {
    const data = await cache.get(`${CLIENT_PREFIX}${clientId}`);
    if (!data) return null;

    try {
        return JSON.parse(data) as RegisteredClient;
    } catch {
        return null;
    }
}

/**
 * Validate that a redirect_uri is allowed for a client
 */
export function isValidRedirectUri(client: RegisteredClient, redirectUri: string): boolean {
    return client.redirect_uris.includes(redirectUri);
}
