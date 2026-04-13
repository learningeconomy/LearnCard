import { getLearnCard } from '@helpers/learnCard.helpers';

type TrustedService = {
    did: string;
    name: string;
    endpoint: string;
};

type InboxService = {
    id: string;
    type: string | string[];
    serviceEndpoint?: string;
    serviceDid?: string;
};

type DidDocumentWithServices = {
    service?: InboxService[];
};

let registryCache: { services: TrustedService[]; expiresAt: number } | null = null;

export const getServerDidWebDID = (_domain: string): string => {
    const domain = (_domain || process.env.DOMAIN_NAME) ?? '';
    const encodedDomain = domain.replace(/:/g, '%3A');
    return `did:web:${encodedDomain}`;
};

const getDidPathMarkerIndex = (parts: string[]): number => {
    const pathMarkerIndex = parts.findIndex((part, index) => {
        if (index < 3) return false;
        return part === 'users' || part === 'app' || part === 'manager';
    });

    return pathMarkerIndex;
};

/**
 * Extracts the server DID from a did:web string.
 *
 * Legacy examples:
 * - did:web:localhost:4000:users:testa -> did:web:localhost:4000
 * - did:web:localhost%3A4000:users:testa -> did:web:localhost%3A4000
 *
 * Preview example:
 * - did:web:pr-123.preview.learncard.ai:brain:users:alice -> did:web:pr-123.preview.learncard.ai:brain
 */
export const getServerDidFromUserDid = (userDid: string): string | null => {
    if (!userDid.startsWith('did:web:')) return null;

    const parts = userDid.split(':');
    if (parts.length < 3) return null;

    const pathMarkerIndex = getDidPathMarkerIndex(parts);

    if (pathMarkerIndex === -1) {
        return userDid;
    }

    return `did:web:${parts.slice(2, pathMarkerIndex).join(':')}`;
};

/**
 * Checks if a brain-service is trusted based on environment whitelist
 * and optionally a remote registry
 */
export const isServiceTrusted = async (senderDid: string, domain: string): Promise<boolean> => {
    const senderServerDid = await getOwningServiceDid(senderDid);
    if (!senderServerDid) return false;

    if (senderServerDid === getServerDidWebDID(domain)) return true;

    const whitelist = (process.env.TRUSTED_BRAIN_SERVICES || '').split(',').filter(Boolean);
    if (whitelist.includes(senderServerDid)) return true;

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

    services.push({
        did: ownDid,
        name: 'Self',
        endpoint: `https://${domain || process.env.DOMAIN_NAME}`,
    });

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

const fetchRegistry = async (registryUrl: string) => {
    if (registryCache && Date.now() < registryCache.expiresAt) {
        return registryCache;
    }

    try {
        const response = await fetch(registryUrl, {
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch registry: ${response.status}`);
        }

        const data = (await response.json()) as { services: TrustedService[] };

        registryCache = {
            services: data.services || [],
            expiresAt: Date.now() + 3600000,
        };

        return registryCache;
    } catch (error) {
        console.error('Failed to fetch brain-service trust registry:', error);
        return { services: [], expiresAt: Date.now() + 60000 };
    }
};

/**
 * Clears the trust registry cache (useful for testing)
 */
export const clearTrustRegistryCache = (): void => {
    registryCache = null;
};

export const extractInboxService = (didDoc: DidDocumentWithServices): InboxService | null => {
    if (!didDoc.service || !Array.isArray(didDoc.service)) {
        return null;
    }

    return (
        didDoc.service.find(service => {
            const type = Array.isArray(service.type) ? service.type[0] : service.type;
            return type === 'UniversalInboxService' || type === 'LearnCardInboxService';
        }) || null
    );
};

/**
 * Extracts the UniversalInboxService endpoint from a DID document's service array
 */
export const extractInboxServiceEndpoint = (didDoc: DidDocumentWithServices): string | null => {
    return extractInboxService(didDoc)?.serviceEndpoint || null;
};

/**
 * Extracts explicit service DID metadata from a DID document's inbox service entry.
 */
export const extractInboxServiceServiceDid = (didDoc: DidDocumentWithServices): string | null => {
    const serviceDid = extractInboxService(didDoc)?.serviceDid;
    return typeof serviceDid === 'string' && serviceDid.length > 0 ? serviceDid : null;
};

/**
 * Resolves the owning service DID for a did:web, preferring explicit DID-doc metadata
 * and falling back to string inference for legacy documents.
 */
export const getOwningServiceDid = async (did: string): Promise<string | null> => {
    const inferredServiceDid = getServerDidFromUserDid(did);

    if (!did.includes(':users:')) {
        return inferredServiceDid;
    }

    try {
        const learnCard = await getLearnCard();
        const didDoc = await learnCard.invoke.resolveDid(did);
        const explicitServiceDid = extractInboxServiceServiceDid(didDoc);

        if (!explicitServiceDid) {
            return inferredServiceDid;
        }

        if (!inferredServiceDid || explicitServiceDid === inferredServiceDid) {
            return explicitServiceDid;
        }

        console.warn(
            `Resolved DID document for ${did} exposed mismatched serviceDid ${explicitServiceDid}; falling back to inferred service DID ${inferredServiceDid}`
        );
        return inferredServiceDid;
    } catch (error) {
        console.error(`Failed to resolve service DID metadata for DID ${did}:`, error);
        return inferredServiceDid;
    }
};

export type InboxServiceResult =
    | { type: 'local'; endpoint: string }
    | { type: 'remote'; endpoint: string }
    | { type: 'not_found'; error: string };

export const findInboxServiceEndpoint = async (
    recipientDid: string,
    domain: string
): Promise<InboxServiceResult> => {
    if (recipientDid.startsWith('did:web:')) {
        const inferredServerDid = getServerDidFromUserDid(recipientDid);
        const localServerDid = getServerDidWebDID(domain);
        const protocol = domain.includes('localhost') ? 'http://' : 'https://';
        const baseUrl = `${protocol}${domain.replace(/%3A/g, ':')}`;
        const localEndpoint = `${baseUrl}/api/inbox/receive`;

        try {
            const learnCard = await getLearnCard();
            const didDoc = await learnCard.invoke.resolveDid(recipientDid);
            const endpoint = extractInboxServiceEndpoint(didDoc);
            const serviceDid = extractInboxServiceServiceDid(didDoc) || inferredServerDid;

            if (endpoint) {
                return {
                    type: serviceDid === localServerDid ? 'local' : 'remote',
                    endpoint,
                };
            }
        } catch (error) {
            console.error(`Failed to resolve DID ${recipientDid}:`, error);
        }

        if (inferredServerDid === localServerDid) {
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

    return {
        type: 'not_found',
        error: `Recipient DID ${recipientDid} is not a did:web and cannot be used for inbox federation`,
    };
};
