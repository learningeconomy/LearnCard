import { getLearnCard } from '@helpers/learnCard.helpers';

type TrustedService = {
    did: string;
    name: string;
    endpoint: string;
};

let registryCache: { services: TrustedService[]; expiresAt: number } | null = null;

export const getServerDidWebDID = (_domain: string): string => {
    const domain = (_domain || process.env.DOMAIN_NAME) ?? '';
    const encodedDomain = domain.replace(/:/g, '%3A');
    return `did:web:${encodedDomain}`;
};

/**
 * Extracts the server DID from a user DID
 * e.g., did:web:localhost:4000:users:testa -> did:web:localhost:4000
 * e.g., did:web:localhost%3A4000:users:testa -> did:web:localhost%3A4000
 */
export const getServerDidFromUserDid = (userDid: string): string | null => {
    if (!userDid.startsWith('did:web:')) return null;

    const parts = userDid.split(':');
    // did:web:domain:path... -> we want did:web:domain
    if (parts.length < 3) return null;

    // Parts are: ['did', 'web', 'domain', 'users', 'profileId']
    // We need to reconstruct did:web:domain
    const domain = parts[2];
    return `did:web:${domain}`;
};

/**
 * Checks if a brain-service is trusted based on environment whitelist
 * and optionally a remote registry
 */
export const isServiceTrusted = async (senderDid: string, domain: string): Promise<boolean> => {
    // Extract the server DID from the sender's user DID
    const senderServerDid = getServerDidFromUserDid(senderDid);
    if (!senderServerDid) return false;

    if (senderServerDid === getServerDidWebDID(domain)) return true;

    // Check env whitelist first (for local overrides)
    const whitelist = (process.env.TRUSTED_BRAIN_SERVICES || '').split(',').filter(Boolean);
    if (whitelist.includes(senderServerDid)) return true;

    // Check remote registry if configured
    const registryUrl = process.env.BRAIN_SERVICE_REGISTRY_URL;
    if (registryUrl) {
        const registry = await fetchRegistry(registryUrl);
        return registry.services.some(s => s.did === senderServerDid);
    }

    return false;
};

/**
 * Gets the list of trusted brain-services
 */
export const getTrustedServices = async (domain: string): Promise<TrustedService[]> => {
    const services: TrustedService[] = [];
    const ownDid = getServerDidWebDID(domain);

    // Add self
    services.push({
        did: ownDid,
        name: 'Self',
        endpoint: `https://${domain || process.env.DOMAIN_NAME}`,
    });

    // Add from env whitelist
    const whitelist = (process.env.TRUSTED_BRAIN_SERVICES || '').split(',').filter(Boolean);
    for (const did of whitelist) {
        if (did !== ownDid) {
            services.push({
                did,
                name: did.replace('did:web:', ''),
                endpoint: `https://${did.replace('did:web:', '')}`,
            });
        }
    }

    // Add from remote registry if configured
    const registryUrl = process.env.BRAIN_SERVICE_REGISTRY_URL;
    if (registryUrl) {
        const registry = await fetchRegistry(registryUrl);
        for (const service of registry.services) {
            if (service.did !== ownDid && !services.find(s => s.did === service.did)) {
                services.push(service);
            }
        }
    }

    return services;
};

/**
 * Fetches the trust registry from a remote URL with caching
 */
const fetchRegistry = async (registryUrl: string) => {
    if (registryCache && Date.now() < registryCache.expiresAt) {
        return registryCache;
    }

    try {
        const response = await fetch(registryUrl, {
            signal: AbortSignal.timeout(10000), // 10 second timeout for registry fetch
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch registry: ${response.status}`);
        }

        const data = (await response.json()) as { services: TrustedService[] };

        registryCache = {
            services: data.services || [],
            expiresAt: Date.now() + 3600000, // 1 hour cache
        };

        return registryCache;
    } catch (error) {
        console.error('Failed to fetch brain-service trust registry:', error);
        // Return empty cache on error
        return { services: [], expiresAt: Date.now() + 60000 }; // 1 minute retry
    }
};

/**
 * Clears the trust registry cache (useful for testing)
 */
export const clearTrustRegistryCache = (): void => {
    registryCache = null;
};

/**
 * Extracts the UniversalInboxService endpoint from a DID document's service array
 */
export const extractInboxServiceEndpoint = (didDoc: {
    service?: Array<{ id: string; type: string | string[]; serviceEndpoint: string }>;
}): string | null => {
    if (!didDoc.service || !Array.isArray(didDoc.service)) {
        return null;
    }

    const inboxService = didDoc.service.find(s => {
        const type = Array.isArray(s.type) ? s.type[0] : s.type;
        return type === 'UniversalInboxService';
    });

    return inboxService?.serviceEndpoint || null;
};

/**
 * Result type for findInboxServiceEndpoint
 */
export type InboxServiceResult =
    | { type: 'local'; endpoint: string }
    | { type: 'remote'; endpoint: string }
    | { type: 'not_found'; error: string };

/**
 * Finds the appropriate inbox service endpoint for a recipient DID.
 *
 * If the DID is a local did:web (matches the current domain), returns the local inbox endpoint.
 * If the DID is a remote did:web, resolves the DID document and looks for UniversalInboxService.
 * Returns an error result if no inbox service can be found.
 *
 * @param recipientDid - The recipient's DID (e.g., did:web:example.com:users:alice)
 * @param domain - The current service's domain (e.g., localhost%3A4000 or learncard.com)
 * @returns InboxServiceResult indicating local, remote, or not found
 */
export const findInboxServiceEndpoint = async (
    recipientDid: string,
    domain: string
): Promise<InboxServiceResult> => {
    // Check if it's a did:web
    if (recipientDid.startsWith('did:web:')) {
        const serverDid = getServerDidFromUserDid(recipientDid);
        const localServerDid = getServerDidWebDID(domain);
        const isLocalDID = serverDid === localServerDid;
        const protocol = domain.includes('localhost') ? 'http://' : 'https://';
        const baseUrl = `${protocol}${domain.replace(/%3A/g, ':')}`;
        const localEndpoint = `${baseUrl}/api/inbox/receive`;

        try {
            const learnCard = await getLearnCard();
            const didDoc = await learnCard.invoke.resolveDid(recipientDid);
            const endpoint = extractInboxServiceEndpoint(didDoc);

            if (endpoint) {
                return {
                    type: endpoint === localEndpoint ? 'local' : 'remote',
                    endpoint,
                };
            }
        } catch (error) {
            console.error(`Failed to resolve DID ${recipientDid}:`, error);
        }

        if (isLocalDID) {
            return {
                type: 'local',
                endpoint: localEndpoint,
            };
        }

        return {
            type: 'not_found',
            error: `Recipient DID ${recipientDid} does not have a UniversalInboxService endpoint in its DID document`,
        };
    }

    // For non-did:web DIDs (did:key, etc.), we can't federate
    return {
        type: 'not_found',
        error: `Recipient DID ${recipientDid} is not a did:web and cannot be used for inbox federation`,
    };
};
