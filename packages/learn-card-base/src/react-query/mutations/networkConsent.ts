import { useMutation } from '@tanstack/react-query';
import { useWallet } from '../../hooks/useWallet';
import { getOrCreateSharedUriForWallet } from '../../hooks/useSharedUrisInTerms';
import { getOrFetchConsentedContracts } from '../../hooks/useConsentedContracts';
import type { QueryClient } from '@tanstack/react-query';

const NETWORK_CONTRACT_URI =
    'lc:network:network.learncard.com/trpc:contract:2ed7b889-c06e-47c4-835b-d924c17e9891';
const CONTRACT_OWNER_DID = 'did:web:network.learncard.com:users:learn-cloud';

const CATEGORIES = [
    'ai-summary',
    'ID',
    'ai-assessment',
    'Skill',
    'Membership',
    'Learning History',
    'Work History',
    'Accomplishment',
    'ai-topic',
    'Family',
    'Course',
    'Achievement',
    'Social Badge',
    'Accommodation',
    'learning-pathway',
];

interface NetworkConsentMutationParams {
    queryClient: QueryClient;
    checkExistingConsent?: boolean; // Default true for backfill, false for signup
}

interface NetworkConsentResult {
    success: boolean;
    alreadyConsented?: boolean;
    error?: string;
}

/**
 * Generates shared URIs for all credentials in all categories and creates consent terms
 */
const generateConsentTerms = async (wallet: any, queryClient: QueryClient): Promise<any> => {
    const categoryCredentials: Record<string, string[]> = {};

    for (const category of CATEGORIES) {
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
                    console.log(
                        `Failed to get shared URI for credential ${credential.uri}:`,
                        error
                    );
                }
            }

            categoryCredentials[category] = sharedUris;
        } catch (error) {
            console.log(`Failed to get credentials for category ${category}:`, error);
            categoryCredentials[category] = [];
        }
    }

    return {
        read: {
            personal: { name: 'Network User' },
            credentials: {
                shareAll: true,
                sharing: true,
                categories: {
                    'ai-summary': {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['ai-summary'] || [],
                    },
                    ID: {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['ID'] || [],
                    },
                    'ai-assessment': {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['ai-assessment'] || [],
                    },
                    Skill: {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Skill'] || [],
                    },
                    Membership: {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Membership'] || [],
                    },
                    'Learning History': {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Learning History'] || [],
                    },
                    'Work History': {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Work History'] || [],
                    },
                    Accomplishment: {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Accomplishment'] || [],
                    },
                    'ai-topic': {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['ai-topic'] || [],
                    },
                    Family: {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Family'] || [],
                    },
                    Course: {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Course'] || [],
                    },
                    Achievement: {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Achievement'] || [],
                    },
                    'Social Badge': {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Social Badge'] || [],
                    },
                    Accommodation: {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['Accommodation'] || [],
                    },
                    'learning-pathway': {
                        shareAll: true,
                        sharing: true,
                        shared: categoryCredentials['learning-pathway'] || [],
                    },
                },
            },
        },
        write: {
            personal: {},
            credentials: {
                categories: {
                    'ai-summary': true,
                    'ai-assessment': true,
                    'learning-pathway': true,
                    'ai-topic': true,
                    ID: true,
                    Family: true,
                    Course: true,
                    'Social Badge': true,
                    'Work History': true,
                    Accommodation: true,
                    Skill: true,
                    Membership: true,
                    'Learning History': true,
                    Accomplishment: true,
                    Achievement: true,
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

                // Generate consent terms with shared URIs for all categories
                const terms = await generateConsentTerms(wallet, queryClient);

                // Consent to the contract
                await wallet.invoke.consentToContract(NETWORK_CONTRACT_URI, { terms });

                return { success: true, alreadyConsented: false };
            } catch (error) {
                console.error('Network consent error:', error);
                return { success: false, error: String(error) };
            }
        },
        scope: { id: 'networkConsentMutation' },
    });
};
