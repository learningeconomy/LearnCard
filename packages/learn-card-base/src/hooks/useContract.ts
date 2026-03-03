import { useQuery } from '@tanstack/react-query';
import { CredentialCategoryEnum, useIsLoggedIn, useWallet } from 'learn-card-base';
import {
    ConsentFlowContract,
    ConsentFlowContractDetails,
    LCNProfile,
    PaginatedConsentFlowDataForDid,
} from '@learncard/types';

export const useContract = (uri: string | undefined, enabled = true) => {
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();

    return useQuery<ConsentFlowContractDetails | undefined>({
        queryKey: ['useContract', uri!],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = isLoggedIn ? await initWallet() : await initWallet('a'.repeat(64));

                const deets = await wallet.invoke.getContract(uri);

                return deets;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};

export const useContractSentRequests = (uri: string | undefined, enabled = true) => {
    const { initWallet } = useWallet();

    return useQuery<
        | {
              profile: LCNProfile;
              status: 'pending' | 'accepted' | 'denied' | null;
              readStatus?: 'unseen' | 'seen' | null;
          }[]
        | undefined
    >({
        queryKey: ['useContractSentRequests', uri!],
        queryFn: async () => {
            if (!uri) return;

            try {
                const wallet = await initWallet();

                const res = await wallet.invoke.getContractSentRequests(uri);

                return res;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(uri),
    });
};

export const useContractRequestStatusForProfile = (
    contractId: string | undefined,
    contractUri: string | undefined,
    targetProfileId: string,
    enabled = true
) => {
    const { initWallet } = useWallet();

    return useQuery<{
        profile: LCNProfile;
        status: 'pending' | 'accepted' | 'denied' | null;
        readStatus?: 'unseen' | 'seen' | null;
    } | null>({
        queryKey: ['useContractRequestStatus', targetProfileId, contractUri!, contractId!],
        queryFn: async () => {
            try {
                const wallet = await initWallet();
                let res;

                try {
                    res = await wallet.invoke.getRequestStatusForProfile(
                        targetProfileId,
                        contractId,
                        contractUri
                    );
                } catch (error) {
                    console.error(error);
                    return null;
                }

                return res;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(contractId || contractUri) && Boolean(targetProfileId),
    });
};

export const useAllContractRequestsForProfile = (targetProfileId: string, enabled = true) => {
    const { initWallet } = useWallet();

    return useQuery<
        | {
              contract: ConsentFlowContract & { uri: string };
              profile: LCNProfile;
              status: 'pending' | 'accepted' | 'denied' | null;
              readStatus?: 'unseen' | 'seen' | null;
          }[]
        | undefined
    >({
        queryKey: ['useAllContractRequestsForProfile', targetProfileId],
        queryFn: async () => {
            const wallet = await initWallet();
            return wallet.invoke.getAllContractRequestsForProfile(targetProfileId) ?? [];
        },
        enabled: enabled && Boolean(targetProfileId),
    });
};

export const useConsentFlowDataForDid = (
    did: string | undefined,
    options?: {
        query?: {
            credentials?: { categories?: Record<string, boolean> };
            personal?: Record<string, boolean>;
            id?: string;
        };
        limit?: number;
        cursor?: string;
    },
    enabled = true
) => {
    const { initWallet } = useWallet();

    return useQuery<PaginatedConsentFlowDataForDid | undefined>({
        queryKey: ['useConsentFlowDataForDid', did, options],
        queryFn: async () => {
            if (!did) return;

            try {
                const wallet = await initWallet();
                return wallet.invoke.getConsentFlowDataForDid(did, options);
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: enabled && Boolean(did),
    });
};

export const useConsentFlowDataForDidByCategory = (
    did: string,
    options?: {
        query?: {
            credentials?: { categories?: Record<string, boolean> };
            personal?: Record<string, boolean>;
            id?: string;
        };
        limit?: number;
        cursor?: string;
    }
) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['useConsentFlowDataForDidByCategory', did, options],
        queryFn: async () => {
            try {
                const wallet = await initWallet();

                const data = await wallet.invoke.getConsentFlowDataForDid(did, options);
                const allCredentials: {
                    category: string;
                    uri: string;
                }[] = data?.records?.flatMap(record => record?.credentials || []) || [];

                const vcsByCategory: Record<string, { category: string; uri: string }[]> = {};

                allCredentials.forEach(credential => {
                    const { category, uri } = credential;

                    if (!vcsByCategory[category]) {
                        vcsByCategory[category] = [];
                    }
                    vcsByCategory[category].push({ category, uri });
                });

                // Example result structure:
                // {
                //     'AI Insight': [
                //         { category: 'AI Insight', uri: 'lc:cloud:localhost%3A4100/trpc:credential:692f49b8f3f04a7aeaf97162' }
                //     ],
                //     'Social Badge': [
                //         { category: 'Social Badge', uri: 'lc:cloud:localhost%3A4100/trpc:credential:692f954bf3f04a7aeaf97169' }
                //     ]
                // }

                return vcsByCategory;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: Boolean(did),
    });
};

export const useResolvedConsentFlowDataForDid = (
    did: string,
    options?: {
        query?: {
            credentials?: { categories?: Record<string, boolean> };
            personal?: Record<string, boolean>;
            id?: string;
        };
        limit?: number;
        cursor?: string;
    }
) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: ['useResolvedConsentFlowDataForDid', did, options],
        queryFn: async () => {
            try {
                const wallet = await initWallet();

                const data = await wallet.invoke.getConsentFlowDataForDid(did, options);

                const allCredentials: {
                    category: string;
                    uri: string;
                }[] = data?.records?.flatMap(record => record?.credentials || []) || [];

                const resolvedCredentials = await Promise.all(
                    allCredentials.map(async credential => await wallet.read.get(credential?.uri))
                );

                return resolvedCredentials;
            } catch (error) {
                return Promise.reject(error);
            }
        },
        enabled: Boolean(did),
    });
};
