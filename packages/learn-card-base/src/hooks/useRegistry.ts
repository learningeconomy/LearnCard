import { useQuery } from '@tanstack/react-query';
import {
    JobRegistryEntry,
    RegistryEntry,
    TrustedAppRegistryEntry,
    LCAStylesPackRegistryEntry,
} from 'learn-card-base';

import { RegistryClient } from '@digitalcredentials/issuer-registry-client';

export const useRegistry = () => {
    return useQuery<RegistryEntry[]>({
        queryKey: ['registry'],
        initialData: [],
        queryFn: async () => {
            const data = await (
                await fetch(
                    process.env.NODE_ENV === 'production'
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
                    process.env.NODE_ENV === 'production'
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
        queryKey: [profileId],
        queryFn: async () => {
            const trustedRegistryClient = new RegistryClient();
            const untrustedRegistryClient = new RegistryClient();

            const trustedResponse = await fetch(
                'https://registries.learncard.com/known-did-registries.json'
            );
            const untrustedResponse = await fetch(
                'https://registries.learncard.com/untrusted-did-registries.json'
            );

            const knownRegistries = await trustedResponse.json();
            const unknownRegistries = await untrustedResponse.json();

            await trustedRegistryClient.use({ registries: knownRegistries });
            await untrustedRegistryClient.use({ registries: unknownRegistries });

            const trustedResults = await trustedRegistryClient.lookupIssuersFor(profileId);
            const untrustedResults = await untrustedRegistryClient.lookupIssuersFor(profileId);

            if (trustedResults?.matchingIssuers.length > 0) {
                return {
                    source: 'trusted',
                    results: trustedResults,
                };
            } else if (untrustedResults?.matchingIssuers.length > 0) {
                return {
                    source: 'untrusted',
                    results: untrustedResults,
                };
            } else {
                return {
                    source: 'unknown',
                    results: {},
                };
            }
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
