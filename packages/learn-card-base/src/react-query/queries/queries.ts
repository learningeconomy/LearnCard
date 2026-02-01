import {
    useQuery,
    useQueries,
    useQueryClient,
    useMutation,
    useInfiniteQuery,
    UseQueryResult,
} from '@tanstack/react-query';
import {
    BoostAndVCType,
    CredentialCategoryEnum,
    useWallet,
    currentUserStore,
    switchedProfileStore,
    LEARNCARD_NETWORK_API_URL,
} from 'learn-card-base';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import {
    Boost,
    BoostRecipientInfo,
    LCNProfile,
    AppStoreListing,
    SentCredentialInfo,
    VC,
    PaginationOptionsType,
    PaginatedLCNProfiles,
    BoostPermissions,
} from '@learncard/types';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import {
    CREDENTIAL_CATEGORIES,
    CredentialCategory,
    IndexMetadata,
} from 'learn-card-base/types/credentials';
import { useIsLoggedIn, useCurrentUser } from 'learn-card-base';
import { getBespokeLearnCard, generatePK } from 'learn-card-base/helpers/walletHelpers';

/** ===============================
 *      BOOST QUERIES
 *  =============================== */

/**
 * Gets all boosts from the wallet and (optionally) filters them by category.
 */
export const getBoosts = async (
    wallet: BespokeLearnCard,
    category?: CredentialCategoryEnum
): Promise<Boost[]> => {
    const data = await wallet.invoke.getBoosts();
    if (!Array.isArray(data) || data.length === 0) return [];
    if (!category) return data;

    // Filter boosts by exact match or combine similar categories.
    return data.filter(boost => {
        if (boost?.category === category) return true;
        if (
            boost?.category === CredentialCategoryEnum.course &&
            category === CredentialCategoryEnum.learningHistory
        ) {
            return true;
        }
        if (
            boost?.category === CredentialCategoryEnum.job &&
            category === CredentialCategoryEnum.workHistory
        ) {
            return true;
        }
        return false;
    });
};

/**
 * Query: Get boosts for (optionally) a specific category.
 */
export const useGetBoosts = (category?: CredentialCategoryEnum) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery({
        queryKey: ['boosts', switchedDid ?? '', category],
        queryFn: async () => {
            const wallet = await initWallet();
            return getBoosts(wallet, category);
        },
    });
};

/**
 * Query: Get a specific boost by its URI.
 */
export const useGetBoost = (uri: string) => {
    const { initWallet } = useWallet();
    return useQuery({
        queryKey: ['useGetBoost', uri],
        queryFn: async () => {
            try {
                const wallet = await initWallet();
                const boost = await wallet.invoke.getBoost(uri);
                return boost;
            } catch (error: any) {
                throw error;
            }
        },
        enabled: !!uri,
    });
};

/**
 * Query: Get multiple boosts by their URIs.
 * Uses useQueries to fetch multiple boosts in parallel while respecting Rules of Hooks.
 */
export const useGetMultipleBoosts = (uris: string[]) => {
    const { initWallet } = useWallet();
    return useQueries({
        queries: uris.map(uri => ({
            queryKey: ['useGetBoost', uri],
            queryFn: async () => {
                try {
                    const wallet = await initWallet();
                    const boost = await wallet.invoke.getBoost(uri);
                    return boost;
                } catch (error: any) {
                    throw error;
                }
            },
            enabled: !!uri,
        })),
    });
};

/**
 * Prefetch boosts for a given category. (The results will be cached.)
 */
export const prefetchBoosts = async (
    wallet: BespokeLearnCard,
    queryClient: ReturnType<typeof useQueryClient>,
    category?: CredentialCategoryEnum
) => {
    return queryClient.fetchQuery({
        queryKey: ['boosts', category],
        queryFn: () => getBoosts(wallet, category),
    });
};

/**
 * Query: Resolve a boost’s associated credential.
 */
export const useResolveBoost = (uri: string | undefined, enabled = true) => {
    const { initWallet } = useWallet();
    return useQuery<VC | undefined>({
        queryKey: ['useResolveBoost', uri],
        queryFn: async () => {
            if (!uri) throw new Error('Boost URI is required to resolve boost.');
            const wallet = await initWallet();
            const vc = await wallet.invoke.resolveFromLCN(uri);
            if (!vc) throw new Error('Unresolveable boost.');
            return vc as VC | undefined;
        },
        enabled: enabled && Boolean(uri),
    });
};

/**
 * Helper: Merge a credential with boost metadata edits.
 */
export const credentialWithEditsHelper = (credential: VC, boostWithMeta?: Boost): VC => {
    const edits = boostWithMeta?.meta?.edits;

    const achievement = (credential?.credentialSubject as any)?.achievement;
    const boostID = credential?.boostID;
    const display = credential?.display;

    const credentialWithEdits: any = {
        ...credential,
        name: edits?.name ?? credential?.name,
        image: edits?.badgeThumbnail ?? credential?.image,
    };

    const credentialSubject: any = {
        ...credential?.credentialSubject,
    };

    const hasAchievementEdit = typeof edits?.description !== 'undefined';
    if (achievement || hasAchievementEdit) {
        credentialSubject.achievement = {
            ...achievement,
            description: edits?.description ?? achievement?.description,
        };
    }

    if (Object.keys(credentialSubject).length) {
        credentialWithEdits.credentialSubject = credentialSubject;
    }

    const hasBoostIdEdit =
        typeof edits?.accentColor !== 'undefined' ||
        typeof edits?.accentFontColor !== 'undefined' ||
        typeof edits?.idBackgroundImage !== 'undefined' ||
        typeof edits?.dimIdBackgroundImage !== 'undefined' ||
        typeof edits?.fontColor !== 'undefined' ||
        typeof edits?.idBackgroundColor !== 'undefined' ||
        typeof edits?.idDescription !== 'undefined' ||
        typeof edits?.idThumbnail !== 'undefined' ||
        typeof edits?.badgeThumbnail !== 'undefined';

    if (boostID || hasBoostIdEdit) {
        credentialWithEdits.boostID = {
            ...boostID,
            accentColor: edits?.accentColor ?? boostID?.accentColor,
            accentFontColor: edits?.accentFontColor ?? boostID?.accentFontColor,
            backgroundImage: edits?.idBackgroundImage ?? boostID?.backgroundImage,
            dimBackgroundImage: edits?.dimIdBackgroundImage ?? boostID?.dimBackgroundImage,
            fontColor: edits?.fontColor ?? boostID?.fontColor,
            idBackgroundColor: edits?.idBackgroundColor ?? boostID?.idBackgroundColor,
            idDescription: edits?.idDescription ?? boostID?.idDescription,
            idThumbnail: edits?.idThumbnail ?? boostID?.idThumbnail,
            issuerThumbnail: edits?.badgeThumbnail ?? boostID?.issuerThumbnail,
        };
    }

    const hasDisplayEdit =
        typeof edits?.backgroundColor !== 'undefined' ||
        typeof edits?.backgroundImage !== 'undefined' ||
        typeof edits?.fadeBackgroundImage !== 'undefined' ||
        typeof edits?.repeatBackgroundImage !== 'undefined' ||
        Boolean(edits?.emoji?.unified);

    if (display || hasDisplayEdit) {
        credentialWithEdits.display = {
            ...display,
            backgroundColor: edits?.backgroundColor ?? display?.backgroundColor,
            backgroundImage: edits?.backgroundImage ?? display?.backgroundImage,
            fadeBackgroundImage: edits?.fadeBackgroundImage ?? display?.fadeBackgroundImage,
            repeatBackgroundImage: edits?.repeatBackgroundImage ?? display?.repeatBackgroundImage,
            emoji: edits?.emoji?.unified ? edits?.emoji : display?.emoji,
        };
    }

    if (typeof edits?.memberTitles !== 'undefined') {
        credentialWithEdits.familyTitles = edits?.memberTitles;
    }

    return credentialWithEdits;
};

/**
 * Hook: Get a credential enriched with boost edits.
 */
export const useGetCredentialWithEdits = (credential: VC | undefined, boostUri?: string) => {
    const {
        data: boostWithMeta,
        isLoading,
        error,
        isError,
    } = useGetBoost(credential?.boostId || boostUri);

    if (!credential || !(credential?.boostId || boostUri)) {
        return { credentialWithEdits: undefined, isLoading: false };
    }
    const credentialWithEdits = credentialWithEditsHelper(credential, boostWithMeta);
    return { credentialWithEdits, isLoading, isError, error };
};

/**
 * Query: Count the number of recipients for a given boost.
 */
export const useCountBoostRecipients = (uri: string | undefined, enabled = true) => {
    const { initWallet } = useWallet();
    return useQuery<number>({
        queryKey: ['useCountBoostRecipients', uri],
        queryFn: async () => {
            if (!uri) throw new Error('Boost URI is required.');
            const wallet = await initWallet();
            return wallet.invoke.countBoostRecipients(uri);
        },
        enabled: enabled && Boolean(uri),
    });
};

/**
 * Query: Resolve multiple boosts via their URIs (using useQueries).
 */
export const useResolveBoosts = (uris?: (string | undefined)[], enabled = true) => {
    const { initWallet } = useWallet();
    const validUris = uris?.filter(Boolean) as string[] | undefined;
    const queries = useQueries({
        queries:
            enabled && validUris
                ? validUris.map(uri => ({
                      queryKey: ['useResolveBoost', uri],
                      queryFn: async (): Promise<VC> => {
                          if (!uri) throw new Error('Boost URI is required.');
                          const wallet = await initWallet();
                          const vc = await wallet.invoke.resolveFromLCN(uri);
                          if (!vc) throw new Error('Unresolveable boost.');
                          return vc as VC;
                      },
                  }))
                : [],
    });
    return queries.map((result, index) => ({ ...result, uri: validUris?.[index] }));
};

/**
 * Query: Get resolved boosts (with boost metadata and associated VC) for a category.
 */
type ResolvedBoost = {
    boost: Boost;
    boostVC: VC;
};

export const useGetResolvedBoostsFromCategory = (category?: CredentialCategoryEnum) => {
    const { initWallet } = useWallet();
    // Optionally, only run if the current user is an LCN user.
    const { data: currentUserIsLCNUser } = useIsCurrentUserLCNUser();
    return useQuery<BoostAndVCType[]>({
        queryKey: ['useGetResolvedBoostsFromCategory', category],
        queryFn: async () => {
            const wallet = await initWallet();
            const boosts = await getBoosts(wallet, category);
            if (!Array.isArray(boosts) || boosts.length === 0) return [];
            const resolvedData = await Promise.all(
                boosts.map(async boost => {
                    const boostVC = await wallet.invoke.resolveFromLCN(boost.uri ?? '');
                    return { boost, boostVC } as ResolvedBoost;
                })
            );
            // Sort by issuance date (newest first)
            return resolvedData.sort((a, b) => {
                const aDate = a.boostVC.issuanceDate || new Date().toISOString();
                const bDate = b.boostVC.issuanceDate || new Date().toISOString();
                return -aDate.localeCompare(bDate);
            });
        },
        enabled: Boolean(currentUserIsLCNUser),
    });
};

/**
 * Query: Get resolved boosts for an array of boosts.
 */
export const useGetResolvedBoosts = (boosts: Boost[]) => {
    const { initWallet } = useWallet();
    return useQuery<BoostAndVCType[]>({
        queryKey: ['resolvedBoost', boosts],
        queryFn: async () => {
            if (!Array.isArray(boosts) || boosts.length === 0) return [];
            const wallet = await initWallet();
            const resolvedData = await Promise.all(
                boosts.map(async boost => {
                    const boostVC = await wallet.invoke.resolveFromLCN(boost.uri);
                    return { boost, boostVC } as ResolvedBoost;
                })
            );
            return resolvedData.sort((a, b) => {
                const aDate = a.boostVC.issuanceDate || new Date().toISOString();
                const bDate = b.boostVC.issuanceDate || new Date().toISOString();
                return -aDate.localeCompare(bDate);
            });
        },
        enabled: !!boosts,
    });
};

/**
 * Hook: Prefetch boosts (and then set categorized data into cache).
 */
export const usePrefetchBoosts = (enabled = true) => {
    const queryClient = useQueryClient();
    const { data } = useGetBoosts();
    if (data) {
        CREDENTIAL_CATEGORIES.forEach(category => {
            const categorizedBoosts = data.filter(boost => {
                if (boost?.category === category) return true;
                if (
                    boost?.category === CredentialCategoryEnum.course &&
                    category === CredentialCategoryEnum.learningHistory
                )
                    return true;
                if (
                    boost?.category === CredentialCategoryEnum.job &&
                    category === CredentialCategoryEnum.workHistory
                )
                    return true;
                return false;
            });
            queryClient.setQueryData(['boosts', category], categorizedBoosts);
        });
    }
    return useResolveBoosts(
        data?.map(boost => boost.uri),
        enabled
    );
};

/**
 * Query: Get boost recipients.
 */
export const useGetBoostRecipients = (boostUri: string | null, enabled = true) => {
    const { initWallet } = useWallet();
    return useQuery<BoostRecipientInfo[]>({
        queryKey: ['boostRecipients', boostUri],
        queryFn: async () => {
            if (!boostUri) throw new Error('Boost URI required.');
            const wallet = await initWallet();
            const data = await wallet.invoke.getBoostRecipients(boostUri);
            return Array.isArray(data) ? data : [];
        },
        enabled,
    });
};

/**
 * Query: Get paginated boost recipients.
 */
export const useGetPaginatedBoostRecipients = (
    boostUri: string | null,
    initialOptions: PaginationOptionsType = { limit: 10 },
    enabled = true
) => {
    const { initWallet } = useWallet();
    return useInfiniteQuery({
        queryKey: ['paginatedBoostRecipients', boostUri, initialOptions],
        queryFn: async ({ pageParam }) => {
            if (!boostUri) throw new Error('Boost URI required.');
            const wallet = await initWallet();
            const options = { ...initialOptions, cursor: pageParam as string | undefined };
            return wallet.invoke.getPaginatedBoostRecipients(
                boostUri,
                options.limit,
                options.cursor
            );
        },
        initialPageParam: initialOptions.cursor,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage.cursor : undefined),
        enabled: enabled && !!boostUri,
    });
};

/**
 * Query: Get boost permissions.
 */
export const useGetBoostPermissions = (boostUri?: string, profileId?: string) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery<BoostPermissions>({
        queryKey: ['boostPermissions', switchedDid ?? '', boostUri ?? ''],
        queryFn: async () => {
            if (!boostUri) throw new Error('Boost URI required.');
            const wallet = await initWallet();
            return wallet.invoke.getBoostPermissions(boostUri, profileId);
        },
        enabled: Boolean(boostUri),
    });
};

export const useGetBoostAdmins = (boostUri?: string) => {
    const { initWallet } = useWallet();
    return useQuery<PaginatedLCNProfiles>({
        queryKey: ['boostAdmins', boostUri ?? ''],
        queryFn: async () => {
            if (!boostUri) throw new Error('Boost URI required.');
            const wallet = await initWallet();
            return wallet.invoke.getBoostAdmins(boostUri, { limit: 100 });
        },
        enabled: Boolean(boostUri),
    });
};

/** ===============================
 *      CONNECTION QUERIES
 *  =============================== */

/**
 * Query: Get all connections.
 * (Deprecated – consider using paginated queries.)
 */
export const useGetConnections = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery<LCNProfile[]>({
        queryKey: ['connections', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();
            const data = await wallet.invoke.getConnections();
            return Array.isArray(data) ? data : [];
        },
    });
};

/**
 * Query: Get paginated connections.
 */
export const useGetPaginatedConnections = (
    initialOptions: PaginationOptionsType = { limit: 10 }
) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useInfiniteQuery({
        queryKey: ['paginatedConnections', switchedDid ?? '', initialOptions],
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();
            const options = { ...initialOptions, cursor: pageParam as string | undefined };
            return wallet.invoke.getPaginatedConnections(options);
        },
        initialPageParam: initialOptions.cursor,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage.cursor : undefined),
    });
};

/**
 * Query: Get a specific connection by profileId.
 */
export const useGetConnection = (profileId: string) => {
    profileId = profileId?.toLowerCase();
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery<LCNProfile | undefined>({
        queryKey: ['connection', switchedDid ?? '', profileId],
        queryFn: async () => {
            const wallet = await initWallet();
            const connections = await wallet.invoke.getConnections();
            return Array.isArray(connections)
                ? connections.find(connection => connection?.profileId?.toLowerCase() === profileId)
                : undefined;
        },
    });
};

/**
 * Query: Get pending connections.
 */
export const useGetPendingConnections = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery<LCNProfile[]>({
        queryKey: ['pendingConnections', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();
            const data = await wallet.invoke.getPendingConnections();
            return Array.isArray(data) ? data : [];
        },
    });
};

/**
 * Query: Get paginated pending connections.
 */
export const useGetPaginatedPendingConnections = (
    initialOptions: PaginationOptionsType = { limit: 10 }
) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useInfiniteQuery({
        queryKey: ['paginatedPendingConnections', switchedDid ?? '', initialOptions],
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();
            const options = { ...initialOptions, cursor: pageParam as string | undefined };
            return wallet.invoke.getPaginatedPendingConnections(options);
        },
        initialPageParam: initialOptions.cursor,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage.cursor : undefined),
    });
};

/**
 * Query: Get connection requests.
 */
export const useGetConnectionsRequests = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery<LCNProfile[]>({
        queryKey: ['getConnectionRequests', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();
            const data = await wallet.invoke.getConnectionRequests();
            return Array.isArray(data) ? data : [];
        },
    });
};

/**
 * Query: Get paginated connection requests.
 */
export const useGetPaginatedConnectionRequests = (
    initialOptions: PaginationOptionsType = { limit: 10 }
) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useInfiniteQuery({
        queryKey: ['paginatedConnectionRequests', switchedDid ?? '', initialOptions],
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();
            const options = { ...initialOptions, cursor: pageParam as string | undefined };
            return wallet.invoke.getPaginatedConnectionRequests(options);
        },
        initialPageParam: initialOptions.cursor,
        getNextPageParam: lastPage => (lastPage?.hasMore ? lastPage.cursor : undefined),
    });
};

/**
 * Query: Get blocked profiles.
 */
export const useGetBlockedProfiles = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery<LCNProfile[]>({
        queryKey: ['getBlockedProfiles', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();
            const data = await wallet.invoke.getBlockedProfiles();
            return Array.isArray(data) ? data : [];
        },
    });
};

/** ===============================
 *      PROFILE QUERIES
 *  =============================== */

/**
 * Mutation: Generate an invite.
 */
interface GenerateInviteInput {
    expiration: number;
    challenge?: string;
}
export const useGenerateInvite = () => {
    const { initWallet } = useWallet();
    return useMutation({
        mutationFn: async ({ expiration, challenge }: GenerateInviteInput) => {
            const wallet = await initWallet();
            if (!wallet?.invoke?.generateInvite) {
                throw new Error('Wallet or generateInvite function not available');
            }
            const data = await wallet.invoke.generateInvite({ expiration, challenge });
            return data;
        },
    });
};

/**
 * Query: Search profiles by profileId.
 */
export const useGetSearchProfiles = (profileId: string) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery<LCNProfile[]>({
        queryKey: ['getSearchProfiles', switchedDid ?? '', profileId],
        queryFn: async () => {
            const wallet = await initWallet();
            const data = await wallet.invoke.searchProfiles(profileId, {
                includeSelf: false,
                includeConnectionStatus: true,
            });
            return Array.isArray(data) ? data : [];
        },
    });
};

/**
 * Hook: Determine if the current user is an LCN user.
 */
type ResultStatus = 'pending' | 'success' | 'error';
export const useIsCurrentUserLCNUser = () => {
    const result = useGetProfile();
    return {
        ...result,
        data: Boolean(result.data),
        isLoading: result.status === 'pending',
    };
};

export const useGetProfile = (
    profileId?: string,
    enabled = true
): UseQueryResult<LCNProfile | null> => {
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<LCNProfile | null>({
        enabled: enabled && (!!profileId || isLoggedIn),
        queryKey: ['getProfile', switchedDid ?? '', profileId],
        queryFn: async (): Promise<LCNProfile | null> => {
            // If user is logged in, try to use the wallet
            if (isLoggedIn) {
                try {
                    const wallet = await initWallet();
                    if (wallet) {
                        if (profileId) {
                            const data = await wallet.invoke.getProfile(profileId);
                            return data ?? null;
                        } else {
                            const data = await wallet.invoke.getProfile();
                            return data ?? null;
                        }
                    }
                } catch (error) {
                    console.warn('Failed to initialize wallet, falling back to public API', error);
                }
            }

            if (!isLoggedIn && profileId) {
                // Fallback to dummy wallet
                try {
                    const dummyString = 'demo@learningeconomy.io';
                    const pk = await generatePK(dummyString);
                    const wallet = await initWallet(pk);
                    if (wallet) {
                        const data = await wallet.invoke.getProfile(profileId);
                        return data ?? null;
                    }
                } catch (error) {
                    console.warn(
                        'Failed to initialize dummy wallet, falling back to public API',
                        error
                    );
                }
            }

            // Fallback to public API if not logged in or wallet init fails
            if (profileId) {
                try {
                    const response = await fetch(
                        `${LEARNCARD_NETWORK_API_URL}/profile/${profileId}`
                    );
                    if (!response.ok) throw new Error('Failed to fetch profile');
                    const data = await response.json();
                    return data ?? null;
                } catch (error) {
                    console.error('Failed to fetch profile from public API', error);
                    return null;
                }
            }

            return null;
        },
    });
};

export const useGetAppStoreListingBySlug = (
    slug?: string,
    enabled = true
): UseQueryResult<AppStoreListing | undefined> => {
    const { initWallet } = useWallet();

    return useQuery<AppStoreListing | undefined>({
        enabled: enabled && Boolean(slug),
        queryKey: ['getPublicAppStoreListingBySlug', slug],
        queryFn: async () => {
            if (!slug) return undefined;

            const wallet = await initWallet();

            if (wallet?.invoke?.getPublicAppStoreListingBySlug) {
                try {
                    return await wallet.invoke.getPublicAppStoreListingBySlug(slug);
                } catch (error) {
                    console.warn('Failed to load app listing by slug', error);
                }
            }

            const networkUrl = networkStore.get.networkUrl() || LEARNCARD_NETWORK_API_URL;

            try {
                const response = await fetch(
                    `${networkUrl}/app-store/public/listing/slug/${slug}`
                );

                if (!response.ok) return undefined;

                return (await response.json()) as AppStoreListing;
            } catch (error) {
                console.warn('Failed to load app listing by slug', error);
                return undefined;
            }
        },
    });
};

/** ===============================
 *      CREDENTIAL QUERIES
 *  =============================== */

/**
 * Query: Get incoming credentials.
 */
export const useGetIncomingCredentials = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery<SentCredentialInfo[]>({
        queryKey: ['incomingCredentials', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();
            const data = await wallet.invoke.getIncomingCredentials();
            return Array.isArray(data) ? data : [];
        },
    });
};

/**
 * Query: Resolve incoming credentials.
 */
export const useGetResolvedIncomingCredentials = (incomingCredentials: SentCredentialInfo[]) => {
    const { resolveCredential } = useWallet();
    return useQuery<any[]>({
        queryKey: ['useGetResolvedIncomingCredentials', incomingCredentials],
        queryFn: async () => {
            if (!Array.isArray(incomingCredentials) || incomingCredentials.length === 0) return [];
            const resolved = await Promise.all(
                incomingCredentials.map(async credential => {
                    const vc = await resolveCredential(credential.uri);
                    return { credential, vc, from: credential.from };
                })
            );
            return resolved;
        },
        enabled: Array.isArray(incomingCredentials) && incomingCredentials.length > 0,
    });
};

/**
 * Query: Get boost admins.
 */
export const useGetAdmins = (boostUri: string) => {
    const { initWallet } = useWallet();
    return useQuery<{ hasMore: boolean; records: LCNProfile[] }>({
        queryKey: ['getAdmins', boostUri],
        queryFn: async () => {
            const wallet = await initWallet();
            return (await wallet.invoke.getBoostAdmins(boostUri)) ?? null;
        },
    });
};

/**
 * Query: Get boost children profile managers.
 */
export const useGetBoostChildrenProfileManagers = (boostUri: string) => {
    const { initWallet } = useWallet();
    return useQuery<{ hasMore: boolean; cursor: string; records: LCNProfile[] }>({
        queryKey: ['getBoostChildrenProfileManagers', boostUri],
        queryFn: async () => {
            const wallet = await initWallet();
            return (await wallet.invoke.getBoostChildrenProfileManagers(boostUri)) ?? null;
        },
    });
};

/**
 * Query: Get available profiles.
 */
export const useGetAvailableProfiles = (query?: { isServiceProfile?: boolean }) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();
    return useQuery<{ hasMore: boolean; records: { profile: LCNProfile; manager: LCNProfile } }>({
        queryKey: ['getAvailableProfiles', switchedDid ?? '', query],
        queryFn: async () => {
            const wallet = await initWallet();
            return (await wallet.invoke.getAvailableProfiles({ query, limit: 50 })) ?? null;
        },
    });
};

/**
 * Query: Get managed profiles.
 */
export const useGetManagedProfiles = (userDid: string) => {
    const currentUser = useCurrentUser();
    return useQuery<{ hasMore: boolean; records: LCNProfile[] }>({
        queryKey: ['useGetManagedProfiles', userDid],
        queryFn: async () => {
            const managerLc = await getBespokeLearnCard(currentUser?.privateKey ?? '', userDid);
            return (await managerLc.invoke.getManagedProfiles()) ?? null;
        },
    });
};

export const useGetDid = (method?: string, enabled = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery({
        enabled,
        queryKey: ['useGetDid', switchedDid ?? '', method],
        queryFn: async () => {
            const wallet = await initWallet();

            return wallet.id.did(method);
        },
    });
};

/** ===============================
 *   SKILL FRAMEWORK QUERIES
 *  =============================== */

/**
 * Query: List skill frameworks managed by the current user
 */
export const useListMySkillFrameworks = () => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery({
        queryKey: ['listMySkillFrameworks', switchedDid ?? ''],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.listMySkillFrameworks();
        },
    });
};

/**
 * Query: Get a skill framework by ID with its skills
 */
export const useGetSkillFrameworkById = (
    frameworkId: string,
    options?: { limit?: number; childrenLimit?: number },
    enabled = true
) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['getSkillFrameworkById', frameworkId, options],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getSkillFrameworkById(frameworkId, options);
        },
        enabled: !!frameworkId && enabled,
    });
};

/**
 * Query: Search skills within a framework
 */
export const useSearchFrameworkSkills = (
    frameworkId: string,
    query: any,
    options?: { limit?: number }
) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['searchFrameworkSkills', frameworkId, query, options],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.searchFrameworkSkills(frameworkId, query, options);
        },
        enabled: !!frameworkId && !!query,
    });
};

export const useGetSkill = (frameworkId: string, skillId: string) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['getSkill', frameworkId, skillId],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getSkill(frameworkId, skillId);
        },
        enabled: !!frameworkId && !!skillId,
    });
};

export const useCountSkillsInFramework = (
    frameworkId: string,
    skillId?: string,
    options?: { recursive?: boolean; onlyCountCompetencies?: boolean }
) => {
    const { initWallet } = useWallet();

    const { recursive = true, onlyCountCompetencies = true } = options ?? {};

    return useQuery({
        queryKey: [
            'countSkillsInFramework',
            frameworkId,
            skillId,
            recursive,
            onlyCountCompetencies,
        ],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.countSkills({
                frameworkId,
                skillId,
                recursive,
                onlyCountCompetencies,
            });
        },
        enabled: !!frameworkId,
    });
};

export const useGetSkillChildren = (frameworkId: string, skillId: string) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['getSkillChildren', frameworkId, skillId],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getSkillChildren(frameworkId, skillId);
        },
        enabled: !!frameworkId && !!skillId,
    });
};

export const useGetSkillPath = (frameworkId: string, skillId: string) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['getSkillPath', frameworkId, skillId],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getSkillPath({ frameworkId, skillId });
        },
        enabled: !!frameworkId && !!skillId,
    });
};

export const useGetSkillFrameworkAdmins = (
    frameworkId: string,
    options?: { enabled?: boolean }
) => {
    const { initWallet } = useWallet();
    const { enabled = true } = options ?? {};

    return useQuery({
        queryKey: ['getSkillFrameworkAdmins', frameworkId],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getSkillFrameworkAdmins(frameworkId);
        },
        enabled: !!frameworkId && enabled,
    });
};

export const useGetBoostsThatUseFramework = (
    frameworkId: string,
    query: any,
    options?: { enabled?: boolean }
) => {
    const { initWallet } = useWallet();
    const { enabled = true } = options ?? {};

    return useQuery({
        queryKey: ['getBoostsThatUseFramework', frameworkId, query],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getBoostsThatUseFramework(
                frameworkId,
                query ? { query } : undefined
            );
        },
        enabled: !!frameworkId && enabled,
    });
};
