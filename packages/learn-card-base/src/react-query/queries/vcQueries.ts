import async from 'async';
import { useEffect, useRef } from 'react';
import {
    useQuery,
    useInfiniteQuery,
    useQueries,
    UseQueryResult,
    useQueryClient,
    QueryClient,
    InfiniteData,
} from '@tanstack/react-query';
import { BoostQuery, CredentialRecord } from '@learncard/types';
import { newCredsStore, switchedProfileStore, useWallet } from 'learn-card-base';

import { getIssuanceDate } from 'learn-card-base/helpers/credentialHelpers';
import { getCategoryForCredential } from 'learn-card-base/hooks/useWallet';
import { CredentialCategory, CredentialCategoryEnum } from '../../types/credentials';
import { VC, PaginationOptionsType } from '@learncard/types';
import { CredentialMetadata, LCR } from 'learn-card-base/types/credential-records';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { credentialWithEditsHelper } from 'learn-card-base';
import {
    ConsentRecord,
    ConsentedContract,
    useSyncConsentContractsMutation,
    useAcceptAndStoreCredentialsMutation,
} from '../mutations/syncConsentFlow';
import { getOrFetchConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import { getOrFetchCredentialRecordForBoost } from 'learn-card-base/hooks/useGetCredentialRecordForBoost';
import { useBackfillBoostUris } from 'learn-card-base/helpers/backfills';

// Global set to track processed credentials across all hook instances
const globalProcessedCredentials = new Set<string>();

const resolveCredential = async (uri: string, initWallet: () => Promise<BespokeLearnCard>) => {
    const wallet = await initWallet();

    return (wallet.read.get(uri) as Promise<VC | undefined>) ?? null;
};

// Resolves a single credential given a valid uri string
export const useGetResolvedCredential = (uri: string | undefined, enabled = true) => {
    const { initWallet } = useWallet();

    return useQuery<VC | undefined>({
        queryKey: ['useGetResolvedCredential', uri!],
        queryFn: async () => resolveCredential(uri!, initWallet),
        staleTime: 1000 * 60 * 60 * 24 * 7,
        enabled: enabled && Boolean(uri),
    });
};

export const getOrFetchResolvedCredential = async (
    uri: string,
    initWallet: () => Promise<BespokeLearnCard>,
    queryClient: QueryClient
) => {
    return queryClient.fetchQuery<VC | undefined>({
        queryKey: ['useGetResolvedCredential', uri],
        queryFn: async () => resolveCredential(uri, initWallet),
        staleTime: 1000 * 60 * 60 * 24 * 7,
    });
};

export const useResolveManyCredentials = (uris: string[] | undefined, enabled = true) => {
    const { initWallet } = useWallet();

    return useQuery<(VC | undefined)[]>({
        queryKey: ['useResolveManyCredentials', uris],
        queryFn: async () => {
            if (!uris) return [];
            const wallet = await initWallet();
            return Promise.all(uris.map(uri => wallet.read.get(uri) as Promise<VC | undefined>));
        },
        staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
        enabled: enabled && Boolean(uris && uris.length > 0),
    });
};

export const useGetResolvedCredentials = (uris?: (string | undefined)[], enabled = true) => {
    const { initWallet } = useWallet();

    return useQueries({
        queries:
            enabled && uris
                ? uris.map(uri => ({
                      queryKey: ['useGetResolvedCredentials', uri],
                      staleTime: 1000 * 60 * 60 * 24 * 7,
                      queryFn: async () => {
                          try {
                              const wallet = await initWallet();
                              const vc = (await wallet.read.get(uri)) as VC | undefined;
                              if (vc) return vc;
                              return Promise.reject(new Error('unresolveable'));
                          } catch (error) {
                              return Promise.reject(error);
                          }
                      },
                  }))
                : [],
    }).map((result, index) => ({ ...result, uri: uris?.[index] }));
};

// Returns an array of stored idx credentials
export const useGetCredentialList = (category?: CredentialCategory, enabled: boolean = true) => {
    const { initWallet } = useWallet();
    const didWeb = switchedProfileStore.use.switchedDid();
    const backfillBoostUris = useBackfillBoostUris();

    return useInfiniteQuery({
        queryKey: ['useGetCredentialList', didWeb ?? '', category ?? ''],
        queryFn: async ({ pageParam }) => {
            try {
                const wallet = await initWallet();

                const data = await wallet.index.LearnCloud.getPage<CredentialMetadata>?.(
                    category ? { category } : undefined,
                    { cursor: pageParam, limit: 12 }
                );

                backfillBoostUris(data?.records ?? []);

                return {
                    ...data,
                    records: data?.records.map(record => ({
                        ...record,
                        ...(record.__v && { __v: Number(record.__v) }),
                    })),
                };
            } catch (error: any) {
                console.error(error);
                return Promise.reject(error);
            }
        },
        initialPageParam: undefined as undefined | string,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage?.cursor : undefined),
        enabled,
    });
};

export const useGetRecordForUri = (uri?: string, enabled = true) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const didWeb = switchedProfileStore.use.switchedDid();

    return useQuery({
        queryKey: ['useGetRecordForUri', didWeb ?? '', uri],
        queryFn: async () => {
            // First, try to find it in existing category cache
            const categoryQueries = queryClient.getQueriesData<
                InfiniteData<{ hasMore: boolean; cursor?: string; records: LCR[] }>
            >({ queryKey: ['useGetCredentialList', didWeb ?? ''] });

            const records = categoryQueries.flatMap(query =>
                query[1]?.pages.flatMap(page => page.records)
            );

            const found = records.find(record => record?.uri === uri);

            if (found) return found;

            const wallet = await initWallet();

            // If not found in cache, fetch directly
            return (await wallet.index.LearnCloud.get<CredentialMetadata>({ uri }))[0];
        },
        enabled: Boolean(uri) && enabled,
    });
};

/* Use 'useGetPaginatedManagedBoostsQuery' instead - deprecated in favor of useGetPaginatedManagedBoostsQuery*/
export const useGetPaginatedManagedBoosts = (
    category?: CredentialCategory | CredentialCategory[],
    options?: PaginationOptionsType,
    enabled: boolean = true
) => {
    const { initWallet } = useWallet();
    const didWeb = switchedProfileStore.use.switchedDid();

    return useInfiniteQuery({
        queryKey: ['useGetPaginatedManagedBoosts', didWeb ?? '', category ?? ''],
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();

            const data = await wallet.invoke.getPaginatedBoosts({
                query: {
                    category: Array.isArray(category) ? { $in: category } : category,
                },
                ...options,
                cursor: pageParam,
            });

            return data;
        },
        initialPageParam: undefined as undefined | string,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage?.cursor : undefined),
        enabled,
    });
};

/* Use this instead of use useGetPaginatedManagedBoosts */
export const useGetPaginatedManagedBoostsQuery = (
    query?: BoostQuery,
    options?: PaginationOptionsType,
    enabled: boolean = true
) => {
    const { initWallet } = useWallet();

    return useInfiniteQuery({
        queryKey: ['useGetPaginatedManagedBoostsQuery', query ?? ''],
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();

            const data = await wallet.invoke.getPaginatedBoosts({
                query,
                limit: 10,
                ...options,
                cursor: pageParam,
            });

            return data;
        },
        initialPageParam: undefined as undefined | string,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage?.cursor : undefined),
        enabled,
    });
};

export const usePrefetchCredentials = (category?: CredentialCategory, enabled = true) => {
    const { data } = useGetCredentialList(category, enabled);

    return useGetResolvedCredentials(
        data?.pages?.flatMap(page => page?.records?.map(record => record.uri)),
        enabled
    );
};

// Returns the credential count for a category of credential eg Achievement
export const useGetCredentialCount = (category?: CredentialCategory, enabled: boolean = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<string | number | null>({
        queryKey: ['useGetCredentialCount', switchedDid ?? '', category],
        queryFn: async () => {
            try {
                const wallet = await initWallet();
                let credentialsCount = null;

                try {
                    // TODO: This is a hack because of our didkit encryption making numbers BigInts >:(
                    credentialsCount = Number(
                        await wallet.index?.LearnCloud.getCount?.({ category })
                    );
                } catch (e) {
                    throw e;
                }

                return credentialsCount;
            } catch (error) {
                console.error(error);
                return Promise.reject(new Error(error));
            }
        },
        enabled,
    });
};

// Returns the count of boosts for a category of credential eg Achievement
export const useCountBoosts = (category?: CredentialCategory, enabled: boolean = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<number>({
        queryKey: ['useCountBoosts', switchedDid ?? '', category],
        queryFn: async () => {
            const wallet = await initWallet();

            const managedCount = await wallet.invoke.countBoosts({ category });

            return managedCount;
        },
    });
};

export type BoostCounts = {
    learningHistoryCount: number;
    socialBadgeCount: number;
    achievementCount: number;
    accomplishmentCount: number;
    workHistoryCount: number;
    accommodationCount: number;
    idCount: number;
    totalBoostsCount: number;
};

export const useTotalBoostCounts = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    const categories = [
        CredentialCategoryEnum.learningHistory,
        CredentialCategoryEnum.socialBadge,
        CredentialCategoryEnum.achievement,
        CredentialCategoryEnum.accomplishment,
        CredentialCategoryEnum.workHistory,
        CredentialCategoryEnum.accommodation,
        CredentialCategoryEnum.id,
    ];

    return useQuery<BoostCounts>({
        queryKey: ['totalBoostCounts', switchedDid],
        queryFn: async () => {
            const wallet = await initWallet();

            const counts = await Promise.all(
                categories.map(category => wallet.invoke.countBoosts({ category }))
            );

            const [
                learningHistoryCount = 0,
                socialBadgeCount = 0,
                achievementCount = 0,
                accomplishmentCount = 0,
                workHistoryCount = 0,
                accommodationCount = 0,
                idCount = 0,
            ] = counts;

            const totalBoostsCount =
                learningHistoryCount +
                socialBadgeCount +
                achievementCount +
                accomplishmentCount +
                workHistoryCount +
                accommodationCount +
                idCount;

            return {
                learningHistoryCount,
                socialBadgeCount,
                achievementCount,
                accomplishmentCount,
                workHistoryCount,
                accommodationCount,
                idCount,
                totalBoostsCount,
            };
        },
    });
};
export type VC_WITH_URI = {
    vc: VC;
    uri?: string;
};

// Returns a list of resolved credentials
export const useGetCredentials = (
    category?: CredentialCategory,
    initialCredentials?: VC[],
    returnUri?: boolean
) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<VC[] | VC_WITH_URI[]>({
        queryKey: ['useGetCredentials', switchedDid, category, returnUri],
        queryFn: async () => {
            try {
                if (initialCredentials) return initialCredentials;

                const wallet = await initWallet();

                let credentialsList: LCR[] = [];

                try {
                    credentialsList = await wallet.index.LearnCloud.get({ category });
                } catch (e) {
                    throw e;
                }

                if (!returnUri) {
                    const resolvedCredentials = (
                        await Promise.all(
                            credentialsList.map(async record => await wallet.read.get(record.uri))
                        )
                    ).filter(Boolean) as VC[];

                    return resolvedCredentials.sort((a, b) => {
                        const aDate = getIssuanceDate(a) ?? '';
                        const bDate = getIssuanceDate(b) ?? '';

                        return bDate.localeCompare(aDate);
                    });
                }

                const resolvedCredentials = (
                    await Promise.all(
                        credentialsList?.map(async record => {
                            const vc = (await wallet.read.get(record?.uri)) as VC;
                            const uri = record?.uri;

                            return { vc, uri };
                        })
                    )
                ).filter(Boolean);

                return resolvedCredentials.sort((a, b) => {
                    const aDate = getIssuanceDate(a.vc) ?? '';
                    const bDate = getIssuanceDate(b.vc) ?? '';

                    return bDate.localeCompare(aDate);
                });
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
    });
};

// query for getting all creds to construct an aggregation of all skills
export const useGetCredentialsForSkills = (enabled: boolean = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<VC[] | VC_WITH_URI[]>({
        queryKey: ['useGetSkills', switchedDid ?? ''],
        queryFn: async () => {
            try {
                const wallet = await initWallet();

                // get all creds by categories
                const [
                    courses,
                    badges,
                    achievements,
                    accomplishments,
                    experiences,
                    accommodations,
                    ids,
                ] = await Promise.all([
                    await wallet.index.LearnCloud.get({
                        category: CredentialCategoryEnum.learningHistory,
                    }),
                    await wallet.index.LearnCloud.get({
                        category: CredentialCategoryEnum.socialBadge,
                    }),
                    await wallet.index.LearnCloud.get({
                        category: CredentialCategoryEnum.achievement,
                    }),
                    await wallet.index.LearnCloud.get({
                        category: CredentialCategoryEnum.accomplishment,
                    }),
                    await wallet.index.LearnCloud.get({
                        category: CredentialCategoryEnum.workHistory,
                    }),
                    await wallet.index.LearnCloud.get({
                        category: CredentialCategoryEnum.accommodation,
                    }),
                    await wallet.index.LearnCloud.get({
                        category: CredentialCategoryEnum.id,
                    }),
                ]);

                // combine all creds
                const credentialsList = [
                    ...courses,
                    ...badges,
                    ...achievements,
                    ...accomplishments,
                    ...experiences,
                    ...accommodations,
                    ...ids,
                ];

                // resolve all creds
                const resolvedCredentials = (
                    await Promise.all(
                        credentialsList.map(async record => await wallet.read.get(record.uri))
                    )
                ).filter(Boolean) as VC[];

                return resolvedCredentials.sort((a, b) => {
                    const aDate = getIssuanceDate(a) ?? '';
                    const bDate = getIssuanceDate(b) ?? '';

                    return bDate.localeCompare(aDate);
                });
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
        enabled,
    });
};

export const getSharedCredentialsQueryKey = (appProfileId: string) => {
    const switchedDid = switchedProfileStore.use.switchedDid();
    return ['credentialsSharedWithApp', switchedDid ?? '', appProfileId?.toLowerCase()];
};
export const useGetCredentialsSharedWithApp = (appProfileId: string) => {
    const { initWallet } = useWallet();

    return useQuery<VC[]>({
        queryKey: getSharedCredentialsQueryKey(appProfileId),
        queryFn: async () => {
            try {
                const wallet = await initWallet();

                const sharedCreds = await wallet.invoke.getSentPresentations(
                    appProfileId?.toLowerCase()
                );
                if (sharedCreds.length === 0) return [];

                const mostRecentBundle = sharedCreds[0];
                const bundle = await wallet.invoke.resolveFromLCN(mostRecentBundle.uri);
                const decrypted = await wallet.invoke.decryptDagJwe<any>(bundle as any);

                return decrypted.verifiableCredential;
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
    });
};

export const useGetCredentialsListFromIDX = user => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<VC[]>({
        queryKey: ['useGetCredentialsListFromIDX', switchedDid ?? '', user],
        queryFn: async () => {
            try {
                const myWallet = await initWallet();
                const currentIndex = await myWallet.invoke.getIDXIndex();
                return currentIndex;
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
    });
};

export type PaginatedLCR = {
    records: CredentialRecord<CredentialMetadata>[];
    hasMore: boolean;
    cursor?: string;
};

export const useGetCredentialsPaginated = (
    category?: CredentialCategory,
    initialCredentials?: VC[],
    returnUri?: boolean,
    cursor: string = '',
    limit: number = 100
) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<VC[] | VC_WITH_URI[]>({
        queryKey: ['useGetCredentials', switchedDid ?? '', category, returnUri],
        queryFn: async () => {
            try {
                if (initialCredentials) return initialCredentials;

                const wallet = await initWallet();

                let credentialsList: PaginatedLCR = { hasMore: false, cursor: '', records: [] };

                try {
                    credentialsList = await wallet.index.LearnCloud.getPage<CredentialMetadata>?.(
                        category ? { category } : undefined,
                        { cursor, limit }
                    );
                } catch (e) {
                    throw e;
                }

                if (!returnUri) {
                    const resolvedCredentials = (
                        await Promise.all(
                            credentialsList?.records?.map(
                                async record => await wallet.read.get(record.uri)
                            )
                        )
                    ).filter(Boolean) as VC[];

                    return resolvedCredentials.sort((a, b) => {
                        const aDate = getIssuanceDate(a) ?? '';
                        const bDate = getIssuanceDate(b) ?? '';

                        return bDate.localeCompare(aDate);
                    });
                }

                const resolvedCredentials = (
                    await Promise.all(
                        credentialsList?.records?.map(async record => {
                            const vc = (await wallet.read.get(record?.uri)) as VC;
                            const uri = record?.uri;

                            return { vc, uri };
                        })
                    )
                ).filter(Boolean);

                return resolvedCredentials.sort((a, b) => {
                    const aDate = getIssuanceDate(a.vc) ?? '';
                    const bDate = getIssuanceDate(b.vc) ?? '';

                    return bDate.localeCompare(aDate);
                });
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
    });
};

type GetCurrentUserTroopIdsRes = {
    globalAdmin: CredentialRecord[];
    nationalAdmin: CredentialRecord[];
    troopLeader: CredentialRecord[];
    scout: CredentialRecord[];
    isScoutGlobalAdmin: boolean;
    isNationalAdmin: boolean;
    isTroopLeader: boolean;
    isScout: boolean;
};

export const useGetCurrentUserTroopIds = (): UseQueryResult<GetCurrentUserTroopIdsRes, Error> => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery({
        queryKey: ['currentUserTroopIds', switchedDid],
        queryFn: async (): Promise<GetCurrentUserTroopIdsRes> => {
            const wallet = await initWallet();

            const credentialQueries = {
                globalAdmin: CredentialCategoryEnum.globalAdminId,
                nationalAdmin: CredentialCategoryEnum.nationalNetworkAdminId,
                troopLeader: CredentialCategoryEnum.troopLeaderId,
                scout: CredentialCategoryEnum.scoutId,
            } as const;

            try {
                const results = await Promise.all(
                    Object.entries(credentialQueries).map(([_, category]) =>
                        wallet.index.LearnCloud.get({ category })
                    )
                );

                const [globalAdmin, nationalAdmin, troopLeader, scout] = results;

                return {
                    globalAdmin,
                    nationalAdmin,
                    troopLeader,
                    scout,
                    isScoutGlobalAdmin: Boolean(globalAdmin?.length),
                    isNationalAdmin: Boolean(nationalAdmin?.length),
                    isTroopLeader: Boolean(troopLeader?.length),
                    isScout: Boolean(scout?.length),
                };
            } catch (error) {
                throw error instanceof Error ? error : new Error('Unknown error occurred');
            }
        },
        retry: 2,
        staleTime: 1 * 60 * 1000,
    });
};

type GetCurrentUserTroopIdsResolvedRes = {
    globalAdmin: VC[];
    nationalAdmin: VC[];
    troopLeader: VC[];
    scout: VC[];
    isScoutGlobalAdmin: boolean;
    isNationalAdmin: boolean;
    isTroopLeader: boolean;
    isScout: boolean;
};

async function fetchCredentials(
    initWallet: () => Promise<BespokeLearnCard>,
    queryClient: QueryClient,
    category?: CredentialCategory,
    returnUri?: boolean
): Promise<VC[]> {
    const wallet = await initWallet();
    const credentialsList: LCR[] = await wallet.index.LearnCloud.get({ category });
    const resolvedCredentials = await Promise.all(
        credentialsList.map(async record => {
            try {
                const _vc = await wallet.read.get(record.uri);
                const boost = await wallet.invoke.getBoost(_vc?.boostId);
                const vc = credentialWithEditsHelper(_vc, boost);
                return vc ? (returnUri ? { vc, uri: record.uri } : vc) : null;
            } catch (error) {
                console.error(`Error resolving credential ${record.uri}:`, error);
                return null;
            }
        })
    );
    return resolvedCredentials.filter(Boolean) as VC[];
}

export const useGetCurrentUserTroopIdsResolved = (
    skipQuery: boolean = false
): UseQueryResult<GetCurrentUserTroopIdsResolvedRes, Error> => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ['useGetCurrentUserTroopIdsResolved', switchedDid],
        queryFn: async (): Promise<GetCurrentUserTroopIdsResolvedRes> => {
            // Create an array of credential categories to fetch
            const categories = [
                CredentialCategoryEnum.globalAdminId,
                CredentialCategoryEnum.nationalNetworkAdminId,
                CredentialCategoryEnum.troopLeaderId,
                CredentialCategoryEnum.scoutId,
            ] as const;

            // Fetch all credentials in parallel using useGetCredentials logic
            const results = await Promise.all(
                categories.map(category => fetchCredentials(initWallet, queryClient, category))
            );

            // Destructure and type the results
            const [globalAdmin, nationalAdmin, troopLeader, scout] = results;

            return {
                globalAdmin,
                nationalAdmin,
                troopLeader,
                scout,
                isScoutGlobalAdmin: globalAdmin.length > 0,
                isNationalAdmin: nationalAdmin.length > 0,
                isTroopLeader: troopLeader.length > 0,
                isScout: scout.length > 0,
            };
        },
        retry: 2,
        staleTime: 5 * 60 * 1000,
        enabled: !skipQuery,
    });
};

// query to get all earned IDs
export const useGetIDs = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<VC[] | VC_WITH_URI[]>({
        queryKey: ['useGetIDs', switchedDid ?? ''],
        queryFn: async () => {
            try {
                const wallet = await initWallet();

                // get all creds by categories
                const [globalAdminIds, nationalNetworkAdminIds, troopLeaderIds, scoutIds] =
                    await Promise.all([
                        await wallet.index.LearnCloud.get({
                            category: CredentialCategoryEnum.globalAdminId,
                        }),
                        await wallet.index.LearnCloud.get({
                            category: CredentialCategoryEnum.nationalNetworkAdminId,
                        }),
                        await wallet.index.LearnCloud.get({
                            category: CredentialCategoryEnum.troopLeaderId,
                        }),
                        await wallet.index.LearnCloud.get({
                            category: CredentialCategoryEnum.scoutId,
                        }),
                    ]);

                // combine all creds
                const credentialsList = [
                    ...globalAdminIds,
                    ...nationalNetworkAdminIds,
                    ...troopLeaderIds,
                    ...scoutIds,
                ];
                // resolve all creds
                const resolvedCredentials = (
                    await Promise.all(
                        credentialsList.map(async record => {
                            const resolvedVC = await wallet.read.get(record.uri);
                            return { ...resolvedVC, uri: record?.uri };
                        })
                    )
                ).filter(Boolean) as VC[];

                return resolvedCredentials.sort((a, b) => {
                    const aDate = getIssuanceDate(a) ?? '';
                    const bDate = getIssuanceDate(b) ?? '';

                    return bDate.localeCompare(aDate);
                });
            } catch (error) {
                return Promise.reject(new Error(error));
            }
        },
    });
};

export const useSyncConsentFlow = (enabled = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    const queryClient = useQueryClient();
    const processingRef = useRef(false);

    const syncContracts = useSyncConsentContractsMutation();
    const acceptAndStore = useAcceptAndStoreCredentialsMutation();

    const query = useQuery<{
        allRecords: ConsentRecord[];
        recordsByCategory: Partial<Record<CredentialCategory, string[]>>;
        allContracts: ConsentedContract[];
    }>({
        queryKey: ['useSyncConsentFlow', switchedDid ?? ''],
        queryFn: async () => {
            const learnCard = await initWallet();

            // Fetch and accumulate credential records
            let result = await learnCard.invoke.getConsentFlowCredentials({
                includeReceived: false,
            });
            const allRecords: ConsentRecord[] = [];
            do {
                result.records.forEach(r =>
                    allRecords.push({
                        credentialUri: r.credentialUri,
                        contractUri: r.contractUri,
                        termsUri: r.termsUri,
                        category: r.category,
                    })
                );
                if (!result.hasMore) break;
                result = await learnCard.invoke.getConsentFlowCredentials({
                    includeReceived: false,
                    cursor: result.cursor,
                });
            } while (true);

            // Resolve credentials and group by category using mapped display names
            // Note: getCategoryForCredential handles boost detection, resolves boost category,
            // maps raw categories to UI/contract display names, and falls back safely.
            const resolvedList = await Promise.all(
                allRecords.map(async ({ credentialUri }) => {
                    const vc = await queryClient.fetchQuery({
                        queryKey: ['useGetResolvedCredential', credentialUri],
                        queryFn: () => learnCard.read.get(credentialUri) as Promise<VC>,
                    });

                    let category: CredentialCategory = 'Achievement';
                    try {
                        if (vc) {
                            category = await getCategoryForCredential(vc, learnCard, false);
                        }
                    } catch (e) {
                        console.warn('Failed to resolve category for credential', credentialUri, e);
                        // keep default fallback
                    }

                    return { credentialUri, category };
                })
            );

            const recordsByCategory = resolvedList.reduce<
                Partial<Record<CredentialCategory, string[]>>
            >((records, { credentialUri, category }) => {
                const key = category;
                const existing = records[key] ?? [];
                records[key] = [...existing, credentialUri];
                return records;
            }, {});

            // Update the store with the counts
            newCredsStore.set.addNewCreds(recordsByCategory);

            const allContracts = await getOrFetchConsentedContracts(queryClient, learnCard);

            return { recordsByCategory, allContracts, allRecords };
        },
        staleTime: 0,
        refetchOnWindowFocus: true,
        enabled: enabled && syncContracts.isIdle && acceptAndStore.isIdle,
    });

    useEffect(() => {
        if (!query.data || query.data.allRecords.length === 0) return;

        if (processingRef.current) return;

        processingRef.current = true;

        (async () => {
            try {
                const wallet = await initWallet();

                // First, atomically claim any unclaimed credentials
                const claimedRecords: ConsentRecord[] = [];
                for (const record of query.data.allRecords) {
                    if (!globalProcessedCredentials.has(record.credentialUri)) {
                        globalProcessedCredentials.add(record.credentialUri);
                        claimedRecords.push(record);
                    }
                }

                if (claimedRecords.length === 0) {
                    return;
                }

                const filteredRecords = await async.filter<ConsentRecord>(
                    claimedRecords,
                    async record => {
                        const existingRecord = await wallet.index.LearnCloud.get({
                            uri: record.credentialUri,
                        });
                        return existingRecord.length === 0;
                    }
                );

                if (filteredRecords.length === 0) {
                    // Release claimed credentials that don't need processing
                    claimedRecords.forEach(record => {
                        globalProcessedCredentials.delete(record.credentialUri);
                    });
                    return;
                }

                acceptAndStore.mutateAsync(
                    {
                        allRecords: filteredRecords,
                    },
                    {
                        onSuccess: () => {
                            syncContracts.mutate({
                                recordsByCategory: query.data.recordsByCategory,
                                allContracts: query.data.allContracts,
                            });
                        },
                        onError: () => {
                            // Remove from processed set if storage failed
                            filteredRecords.forEach(record => {
                                globalProcessedCredentials.delete(record.credentialUri);
                            });
                        },
                    }
                );
            } finally {
                processingRef.current = false;
            }
        })();
    }, [query.data?.allRecords?.map(record => record.credentialUri).join(',') || '']);

    return query;
};

export const useGetSummaryInfo = (summaryUri?: string) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ['useGetSummaryInfo', summaryUri],
        queryFn: async () => {
            const wallet = await initWallet();
            const summaryVc = (await wallet.read.get(summaryUri)) as VC;
            const summaryBoostUri = summaryVc?.boostId;
            const summaryBoost = (await wallet.invoke.getBoost(summaryBoostUri))!;
            const summaryRecord = await getOrFetchCredentialRecordForBoost(
                summaryBoostUri,
                initWallet,
                queryClient
            );

            const { records } = await wallet.invoke.getFamilialBoosts(summaryBoostUri, {
                parentGenerations: 1,
                childGenerations: 1,
                limit: 100,
            });

            const topicBoost = records.find(r => r.category === 'ai-topic');
            const assessmentBoost = records.find(r => r.category === 'ai-assessment');

            const topicRecord = topicBoost
                ? await getOrFetchCredentialRecordForBoost(topicBoost.uri, initWallet, queryClient)
                : undefined;

            const assessmentRecord = assessmentBoost
                ? await getOrFetchCredentialRecordForBoost(
                      assessmentBoost.uri,
                      initWallet,
                      queryClient
                  )
                : undefined;

            const topicVc = topicRecord
                ? await getOrFetchResolvedCredential(topicRecord.uri, initWallet, queryClient)
                : undefined;
            const assessmentVc = assessmentRecord
                ? await getOrFetchResolvedCredential(assessmentRecord.uri, initWallet, queryClient)
                : undefined;

            return {
                summaryVc,
                summaryRecord,
                summaryBoost,
                topicVc,
                topicBoost,
                topicRecord,
                assessmentVc,
                assessmentBoost,
                assessmentRecord,
            };
        },
        enabled: Boolean(summaryUri),
        staleTime: 0,
        refetchOnMount: 'always',
    });
};
