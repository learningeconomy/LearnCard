import { QueryClient, queryOptions } from '@tanstack/react-query';
import type { Registry } from '@digitalcredentials/issuer-registry-client';
import jwtDecode from 'jwt-decode';

export const ISSUER_REGISTRY_STALE_TIME = 60_000;
const TRUSTED_LIST = 'https://registries.learncard.com/known-did-registries.json';
const UNTRUSTED_LIST = 'https://registries.learncard.com/untrusted-did-registries.json';

type FederationMetadata = {
    credential_registry_entity?: { ctid?: string; ce_url?: string };
    ror_entity?: { rorid?: string; ror_url?: string };
    federation_entity: {
        organization_name?: string;
        federation_fetch_endpoint?: string;
        homepage_uri?: string;
        location?: string;
    };
};
type EntityConfiguration = { metadata: FederationMetadata };
type LegacyDocument = {
    registry: Record<string, { name: string; url: string; location?: string } | null>;
};
type IssuerMatch = { issuer: FederationMetadata; registry: object };

/** Public registry data only. QueryClient owns freshness, in-flight sharing and eviction. */
const readDocument = <T>(
    client: QueryClient,
    url: string,
    format: 'json' | 'jwt',
    allowNotFound = false
) =>
    client.fetchQuery({
        queryKey: ['issuerRegistryDocument', format, url],
        staleTime: ISSUER_REGISTRY_STALE_TIME,
        gcTime: 5 * 60_000,
        retry: false,
        queryFn: async (): Promise<T | null> => {
            const response = await fetch(url);
            // A missing OIDF issuer is a valid negative lookup, not a registry outage.
            if (allowNotFound && response.status === 404) return null;
            if (!response.ok) throw new Error(`Registry request failed: ${response.status}`);
            return format === 'json' ? response.json() : jwtDecode<T>(await response.text());
        },
    });

const lookupIssuers = async (
    client: QueryClient,
    registries: Registry[],
    did: string
): Promise<{ matchingIssuers: IssuerMatch[]; uncheckedRegistries: Registry[] }> => {
    const lookups = await Promise.all(
        registries.map(async entry => {
            try {
                if (entry.type === 'dcc-legacy') {
                    if (!entry.url) throw new Error('Missing registry URL');
                    const document = await readDocument<LegacyDocument>(client, entry.url, 'json');
                    const issuer = document?.registry[did];
                    if (!issuer) return {};
                    return {
                        match: {
                            issuer: {
                                federation_entity: {
                                    organization_name: issuer.name,
                                    homepage_uri: issuer.url,
                                    location: issuer.location,
                                },
                            },
                            registry: {
                                type: 'dcc-legacy',
                                federation_entity: { organization_name: entry.name },
                                institution_additional_information: { legacy_list: entry.url },
                            },
                        } satisfies IssuerMatch,
                    };
                }
                if (entry.type === 'oidf') {
                    if (!entry.trustAnchorEC) throw new Error('Missing trust anchor URL');
                    const anchor = await readDocument<EntityConfiguration>(
                        client,
                        entry.trustAnchorEC,
                        'jwt'
                    );
                    const endpoint = anchor?.metadata.federation_entity.federation_fetch_endpoint;
                    if (!endpoint) throw new Error('Missing issuer lookup endpoint');
                    const url = new URL(endpoint);
                    url.searchParams.set('sub', did);
                    const issuer = await readDocument<EntityConfiguration>(
                        client,
                        url.href,
                        'jwt',
                        true
                    );
                    if (!issuer) return {};
                    return { match: { issuer: issuer.metadata, registry: anchor!.metadata } };
                }
                return {};
            } catch {
                // Preserve the registry client's partial-failure behavior without caching errors.
                return { unchecked: entry };
            }
        })
    );
    return {
        matchingIssuers: lookups.flatMap(result => (result.match ? [result.match] : [])),
        uncheckedRegistries: lookups.flatMap(result =>
            result.unchecked ? [result.unchecked] : []
        ),
    };
};

/** Registry labels are informational; decoding federation JWTs does not verify signatures. */
export const knownDIDRegistryQueryOptions = (client: QueryClient, did?: string) =>
    queryOptions({
        queryKey: ['knownDIDRegistry', did],
        enabled: !!did,
        // Re-evaluate partial failures on remount; successful documents retain their own TTL.
        staleTime: 0,
        queryFn: async () => {
            if (!did) throw new Error('Missing issuer DID');
            const [trusted, untrusted] = await Promise.all([
                readDocument<Registry[]>(client, TRUSTED_LIST, 'json'),
                readDocument<Registry[]>(client, UNTRUSTED_LIST, 'json'),
            ]);
            if (!Array.isArray(trusted) || !Array.isArray(untrusted)) {
                throw new Error('Invalid registry list');
            }
            const [trustedResults, untrustedResults] = await Promise.all([
                lookupIssuers(client, trusted, did),
                lookupIssuers(client, untrusted, did),
            ]);
            if (trustedResults.matchingIssuers.length) {
                return { source: 'trusted' as const, results: trustedResults };
            }
            if (untrustedResults.matchingIssuers.length) {
                return { source: 'untrusted' as const, results: untrustedResults };
            }
            return { source: 'unknown' as const, results: {} };
        },
    });
