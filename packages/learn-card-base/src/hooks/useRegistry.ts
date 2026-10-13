import { useQuery } from '@tanstack/react-query';
import {
    JobRegistryEntry,
    RegistryEntry,
    TrustedAppRegistryEntry,
    LCAStylesPackRegistryEntry,
} from 'learn-card-base';

import { RegistryClient } from '@digitalcredentials/issuer-registry-client';
import { isProductionEnvironment } from '../config/isProduction';

export const useRegistry = () => {
    return useQuery<RegistryEntry[]>({
        queryKey: ['registry'],
        initialData: [],
        queryFn: async () => {
            const data = await (
                await fetch(
                    isProductionEnvironment()
                        ? 'https://raw.githubusercontent.com/WeLibraryOS/metaversity-registry/main/registry.json'
                        : 'https://raw.githubusercontent.com/WeLibraryOS/metaversity-registry/main/dev-registry.json'
                )
            ).json();

            if (!Array.isArray(data)) return [];

            return data;
        },
    });
};

export const useJobsRegistry = () => {
    return useQuery<JobRegistryEntry[]>({
        queryKey: ['jobregistry'],
        queryFn: async () => {
            const data = await (
                await fetch(
                    isProductionEnvironment()
                        ? 'https://raw.githubusercontent.com/WeLibraryOS/metaversity-registry/main/jobs-registry.json'
                        : 'https://raw.githubusercontent.com/WeLibraryOS/metaversity-registry/main/dev-jobs-registry.json'
                )
            ).json();

            if (!Array.isArray(data)) return [];

            return data;
        },
    });
};

export const useTrustedAppsRegistry = (profileId?: string) => {
    return useQuery<TrustedAppRegistryEntry[]>({
        queryKey: ['trustedappregistry', profileId],
        queryFn: async () => {
            const data = await (
                await fetch(
                    'https://raw.githubusercontent.com/learningeconomy/registries/main/learncard/trusted-app-registry.json'
                )
            ).json();

            if (!Array.isArray(data)) return [];

            if (profileId) {
                // if the user asked for a specic profile, return that profile
                return (
                    data.find(
                        profile => profile?.profileId?.toLowerCase() === profileId?.toLowerCase()
                    ) ?? null
                );
            }

            return data;
        },
    });
};

export const useKnownDIDRegistry = (profileId?: string) => {
    return useQuery({
        queryKey: ['knownDidRegistry', profileId],
        staleTime: 60 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        enabled: !!profileId,
        queryFn: async () => {
            if (!profileId) {
                return { source: 'unknown' as const, results: {} };
            }

            const trustedRegistryClient = new RegistryClient();
            const untrustedRegistryClient = new RegistryClient();

            // Fetch both registry catalogues in parallel
            const [trustedResponse, untrustedResponse] = await Promise.all([
                fetch('https://registries.learncard.com/known-did-registries.json'),
                fetch('https://registries.learncard.com/untrusted-did-registries.json'),
            ]);

            if (!trustedResponse.ok) {
                throw new Error(`Failed to fetch known registries: ${trustedResponse.status}`);
            }
            if (!untrustedResponse.ok) {
                throw new Error(
                    `Failed to fetch untrusted registries: ${untrustedResponse.status}`
                );
            }

            const [knownRegistries, unknownRegistries] = await Promise.all([
                trustedResponse.json(),
                untrustedResponse.json(),
            ]);

            // Initialize both clients in parallel
            await Promise.all([
                trustedRegistryClient.use({ registries: knownRegistries }),
                untrustedRegistryClient.use({ registries: unknownRegistries }),
            ]);

            // Lookup in both registries in parallel
            const [trustedResults, untrustedResults] = await Promise.all([
                trustedRegistryClient.lookupIssuersFor(profileId),
                untrustedRegistryClient.lookupIssuersFor(profileId),
            ]);

            const trustedUncheckedCount = trustedResults?.uncheckedRegistries?.length ?? 0;
            const untrustedUncheckedCount = untrustedResults?.uncheckedRegistries?.length ?? 0;

            // Trusted match is conclusive — return immediately
            if (trustedResults?.matchingIssuers.length > 0) {
                return {
                    source: 'trusted' as const,
                    results: trustedResults,
                };
            }

            // Before accepting an untrusted match, ensure trusted lookup was complete.
            // A DID may exist in both registries; if trusted registries failed, we can't
            // be certain this isn't a trusted issuer, so retry rather than cache "untrusted".
            if (untrustedResults?.matchingIssuers.length > 0) {
                if (trustedUncheckedCount > 0) {
                    throw new Error(
                        `Registry lookup inconclusive: ${trustedUncheckedCount} trusted registries could not be checked`
                    );
                }
                return {
                    source: 'untrusted' as const,
                    results: untrustedResults,
                };
            }

            // No matches found — ensure all registries were checked before caching "unknown"
            const totalUncheckedCount = trustedUncheckedCount + untrustedUncheckedCount;
            if (totalUncheckedCount > 0) {
                throw new Error(
                    `Registry lookup inconclusive: ${totalUncheckedCount} registries could not be checked`
                );
            }

            return {
                source: 'unknown' as const,
                results: {},
            };
        },
    });
};

export const useLCAStylesPackRegistry = () => {
    return useQuery<LCAStylesPackRegistryEntry[]>({
        queryKey: ['lcastylespackregistry'],
        queryFn: async () => {
            const data = await (
                await fetch(
                    'https://raw.githubusercontent.com/WeLibraryOS/metaversity-registry/main/lca-style-packs-registry.json'
                )
            ).json();

            if (!Array.isArray(data)) return [];

            return data;
        },
    });
};

export const useScoutPassStylesPackRegistry = () => {
    return useQuery<LCAStylesPackRegistryEntry[]>({
        queryKey: ['scoutstylespackregistry'],
        queryFn: async () => {
            const data = await (
                await fetch(
                    'https://raw.githubusercontent.com/WeLibraryOS/metaversity-registry/main/scoutpass-style-pack-registry.json'
                )
            ).json();

            if (!Array.isArray(data)) return [];

            return data;
        },
    });
};

export default useRegistry;
