type TrustedService = {
    did: string;
    name: string;
    endpoint: string;
};

let registryCache: { services: TrustedService[]; expiresAt: number } | null = null;

/**
 * Gets the server's own did:web DID for comparison
 */
export const getServerDidWebDID = (_domain: string): string => {
    const domain = process.env.DOMAIN_NAME || _domain;
    return `did:web:${domain}`;
};

/**
 * Checks if a brain-service is trusted based on environment whitelist
 * and optionally a remote registry
 */
export const isServiceTrusted = async (serviceDid: string, domain: string): Promise<boolean> => {
    // Always trust self
    if (serviceDid === getServerDidWebDID(domain)) return true;

    // Check env whitelist first (for local overrides)
    const whitelist = (process.env.TRUSTED_BRAIN_SERVICES || '').split(',').filter(Boolean);
    if (whitelist.includes(serviceDid)) return true;

    // Check remote registry if configured
    const registryUrl = process.env.BRAIN_SERVICE_REGISTRY_URL;
    if (registryUrl) {
        const registry = await fetchRegistry(registryUrl);
        return registry.services.some(s => s.did === serviceDid);
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
        endpoint: `https://${process.env.DOMAIN_NAME || 'network.learncard.com'}`,
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
        const response = await fetch(registryUrl);
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
 * Extracts the brain-service endpoint from a DID document's service array
 */
export const extractBrainServiceEndpoint = (didDoc: {
    service?: Array<{ id: string; type: string; serviceEndpoint: string }>;
}): string | null => {
    if (!didDoc.service || !Array.isArray(didDoc.service)) {
        return null;
    }

    const brainService = didDoc.service.find(
        s => s.type === 'LearnCardBrainService' || s.id.includes('brain-service')
    );

    return brainService?.serviceEndpoint || null;
};
