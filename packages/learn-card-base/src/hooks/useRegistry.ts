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
        // Incomplete results get 60s freshness; conclusive results get 1 hour
        staleTime: query =>
            (query.state.data as { incomplete?: boolean } | undefined)?.incomplete
                ? 60_000
                : 60 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        enabled: !!profileId,
        // Limit retries for catalogue fetch failures to avoid retry storms
        retry: 1,
        queryFn: async () => {
            if (!profileId) {
                return { source: 'unknown' as const, results: {}, incomplete: false };
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
            const totalUncheckedCount = trustedUncheckedCount + untrustedUncheckedCount;

            // Trusted match is conclusive — return immediately
            if (trustedResults?.matchingIssuers.length > 0) {
                return {
                    source: 'trusted' as const,
                    results: trustedResults,
                    incomplete: false,
                };
            }

            // Return untrusted match even if trusted lookup was incomplete.
            // This keeps the "untrusted" warning visible (safety) while flagging
            // the result for re-check within 60 seconds.
            if (untrustedResults?.matchingIssuers.length > 0) {
                return {
                    source: 'untrusted' as const,
                    results: untrustedResults,
                    incomplete: trustedUncheckedCount > 0,
                };
            }

            // No matches found — flag as incomplete if any registries couldn't be checked
            return {
                source: 'unknown' as const,
                results: {},
                incomplete: totalUncheckedCount > 0,
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
