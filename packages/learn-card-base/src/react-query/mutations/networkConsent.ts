import { useMutation } from '@tanstack/react-query';
import { useWallet } from '../../hooks/useWallet';
import { getOrCreateSharedUriForWallet } from '../../hooks/useSharedUrisInTerms';
import { getOrFetchConsentedContracts } from '../../hooks/useConsentedContracts';
import type { QueryClient } from '@tanstack/react-query';
import { isProductionNetwork } from '../../helpers/networkHelpers';
import { getLogger } from '../../logging/logger';
const log = getLogger('network-consent');

const NETWORK_CONTRACT_URI =
    'lc:network:network.learncard.com/trpc:contract:2ed7b889-c06e-47c4-835b-d924c17e9891';
const CONTRACT_OWNER_DID = 'did:web:network.learncard.com:users:learn-cloud';

type ContractFieldConfig = {
    required: boolean;
    defaultEnabled?: boolean;
};

const getPersonalValue = (key: string, value: ContractFieldConfig): string => {
    if (!value.required && !value.defaultEnabled) {
        return '';
    }

    if (key.toLowerCase() === 'name') {
        return 'Network User';
    }

    if (key.toLowerCase() === 'email') {
        return 'anonymous@hidden.com';
    }

    return '';
};

interface NetworkConsentMutationParams {
    queryClient: QueryClient;
    checkExistingConsent?: boolean; // Default true for backfill, false for signup
}

interface NetworkConsentResult {
    success: boolean;
    alreadyConsented?: boolean;
    error?: string;
}

const generateConsentTerms = async (wallet: any, queryClient: QueryClient): Promise<any> => {
    const contractDetails = await wallet.invoke.getContract(NETWORK_CONTRACT_URI);
    const contract = contractDetails?.contract;

    if (!contract) {
        throw new Error('Could not load the LearnCard Network contract.');
    }

    const readPersonalEntries = Object.entries(contract.read?.personal ?? {}) as Array<
        [string, ContractFieldConfig]
    >;
    const writePersonalEntries = Object.entries(contract.write?.personal ?? {}) as Array<
        [string, ContractFieldConfig]
    >;
    const readCategoryEntries = Object.entries(
        contract.read?.credentials?.categories ?? {}
    ) as Array<[string, ContractFieldConfig]>;
    const writeCategoryEntries = Object.entries(
        contract.write?.credentials?.categories ?? {}
    ) as Array<[string, ContractFieldConfig]>;

    const categoryCredentials: Record<string, string[]> = {};

    for (const [category] of readCategoryEntries) {
        try {
            const credentials = await wallet.index.LearnCloud.get({ category });
            const sharedUris: string[] = [];

            for (const credential of credentials) {
                try {
                    const sharedUri = await getOrCreateSharedUriForWallet(
                        wallet,
                        CONTRACT_OWNER_DID,
                        queryClient,
                        credential.uri,
                        category
                    );
                    if (sharedUri) {
                        sharedUris.push(sharedUri);
                    }
                } catch (error) {
                    log.debug(`Failed to get shared URI for credential ${credential.uri}:`, error);
                }
            }

            categoryCredentials[category] = sharedUris;
        } catch (error) {
            log.debug(`Failed to get credentials for category ${category}:`, error);
            categoryCredentials[category] = [];
        }
    }

    const readPersonal = Object.fromEntries(
        readPersonalEntries.map(([key, value]) => [key, getPersonalValue(key, value)])
    );

    const writePersonal = Object.fromEntries(
        writePersonalEntries.map(([key, value]) => [
            key,
            Boolean(value.required || value.defaultEnabled),
        ])
    );

    return {
        read: {
            anonymize: contract.read?.anonymize,
            personal: readPersonal,
            credentials: {
                shareAll: contract.read?.credentials?.shareAll ?? true,
                sharing: contract.read?.credentials?.sharing ?? true,
                categories: {
                    ...Object.fromEntries(
                        readCategoryEntries.map(([category]) => [
                            category,
                            {
                                shareAll: true,
                                sharing: true,
                                shared: categoryCredentials[category] || [],
                            },
                        ])
                    ),
                },
            },
        },
        write: {
            personal: writePersonal,
            credentials: {
                categories: {
                    ...Object.fromEntries(
                        writeCategoryEntries.map(([category]) => [category, true])
                    ),
                },
            },
        },
    };
};

/**
 * React Query mutation for consenting to the LearnCard Network contract.
 * Handles both new user signup and existing user backfill scenarios.
 */
export const useNetworkConsentMutation = () => {
    const { initWallet } = useWallet();

    return useMutation<NetworkConsentResult, Error, NetworkConsentMutationParams>({
        mutationFn: async ({ queryClient, checkExistingConsent = true }) => {
            if (!isProductionNetwork()) {
                return { success: true, alreadyConsented: true };
            }

            try {
                const wallet = await initWallet();
                await wallet.invoke.getProfile();

                // Check if user has already consented (for backfill scenarios)
                if (checkExistingConsent) {
                    const allContracts = await getOrFetchConsentedContracts(queryClient, wallet);
                    const existingConsent = allContracts.find(
                        contract => contract.contract.uri === NETWORK_CONTRACT_URI
                    );

                    if (existingConsent) {
                        return { success: true, alreadyConsented: true };
                    }
                }

                // Generate consent terms using only the categories defined by the contract
                const terms = await generateConsentTerms(wallet, queryClient);

                // Consent to the contract
                await wallet.invoke.consentToContract(NETWORK_CONTRACT_URI, { terms });

                return { success: true, alreadyConsented: false };
            } catch (error) {
                log.error('Network consent error:', error);
                return { success: false, error: String(error) };
            }
        },
        scope: { id: 'networkConsentMutation' },
    });
};
