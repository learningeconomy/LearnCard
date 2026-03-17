import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { useWallet } from './useWallet';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { LCR } from 'learn-card-base/types/credential-records';

const VERIFIABLE_DATA_CATEGORY = 'VerifiableData';

export type VerifiableDataOptions = {
    /** Optional credential category. Defaults to 'VerifiableData' */
    category?: string;
};

type VerifiableDataRecord<T> = LCR & {
    verifiableData?: T;
};

/**
 * Creates a simple self-issued credential containing arbitrary data.
 * Uses wallet.invoke.newCredential to ensure proper context handling.
 * The data is stored as JSON in the achievement description/narrative fields.
 */
const createVerifiableDataCredential = async <T>(
    wallet: BespokeLearnCard,
    key: string,
    data: T
) => {
    const did = wallet.id.did();
    const currentDate = new Date().toISOString();

    // Serialize data to JSON string for storage in standard VC fields
    const serializedData = JSON.stringify(data);

    // Use newCredential which handles context properly
    const unsignedCredential = wallet.invoke.newCredential({
        subject: did,
        type: 'achievement',
        issuanceDate: currentDate,
        achievementName: `VerifiableData: ${key}`,
        achievementType: 'ext:VerifiableData',
        achievementDescription: serializedData,
        achievementNarrative: key,
    });

    const signedCredential = await wallet.invoke.issueCredential(unsignedCredential);

    return signedCredential;
};

/**
 * Stores a verifiable data credential and indexes it.
 * If a record with this key already exists, it will be replaced.
 */
const storeVerifiableData = async <T>(
    wallet: BespokeLearnCard,
    key: string,
    data: T,
    category: string
): Promise<string> => {
    // First, delete any existing record with this key
    const existingRecords = await wallet.index.LearnCloud.get<VerifiableDataRecord<T>>({
        id: `__verifiable_data_${key}__`,
    });

    if (existingRecords?.length > 0) {
        for (const record of existingRecords) {
            try {
                await wallet.index.LearnCloud.remove(record.id);
            } catch (e) {
                console.warn('Failed to remove existing verifiable data record:', e);
            }
        }
    }

    // Create and sign the credential
    const credential = await createVerifiableDataCredential(wallet, key, data);

    // Store the credential
    const uri = await wallet.store.LearnCloud.uploadEncrypted?.(credential);

    if (!uri) throw new Error('Failed to store verifiable data credential.');

    // Index the credential with the unique key as the ID
    await wallet.index.LearnCloud.add<VerifiableDataRecord<T>>({
        uri,
        id: `__verifiable_data_${key}__`,
        category,
        title: `VerifiableData: ${key}`,
        verifiableData: data,
    });

    return uri;
};

/**
 * Retrieves verifiable data for a given key.
 */
const getVerifiableData = async <T>(
    wallet: BespokeLearnCard,
    key: string
): Promise<T | undefined> => {
    const records = await wallet.index.LearnCloud.get<VerifiableDataRecord<T>>({
        id: `__verifiable_data_${key}__`,
    });

    if (records?.length > 0 && records[0].verifiableData !== undefined) {
        // Return the data from the index record directly (faster)
        return records[0].verifiableData;
    }

    // Fallback: try to read from the credential itself
    if (records?.length > 0 && records[0].uri) {
        try {
            const credential = await wallet.read.get(records[0].uri);
            // Data is stored as JSON string in achievement description
            const achievement = credential?.credentialSubject?.achievement;
            const description = Array.isArray(achievement)
                ? achievement[0]?.description
                : achievement?.description;

            if (description) {
                return JSON.parse(description) as T;
            }
        } catch (e) {
            console.warn('Failed to read verifiable data credential:', e);
        }
    }

    return undefined;
};

/**
 * Hook for storing and retrieving arbitrary verifiable data.
 *
 * This hook provides a simple interface for storing arbitrary data as self-issued
 * verifiable credentials. The data is stored in LearnCloud and can be retrieved later.
 *
 * When saving, the old credential is deleted and replaced with a new one.
 *
 * @param key - Unique key identifying this type of data (e.g., 'skill-profile-goals')
 * @param options - Optional configuration
 * @returns Object containing data, loading states, and save function
 *
 * @example
 * ```typescript
 * type SalaryData = { salary: string; salaryType: 'per_year' | 'per_hour' };
 *
 * const { data, isLoading, save, isSaving } = useVerifiableData<SalaryData>('skill-profile-salary');
 *
 * // Pre-populate form from existing data
 * useEffect(() => {
 *   if (data) {
 *     setSalary(data.salary);
 *     setSalaryType(data.salaryType);
 *   }
 * }, [data]);
 *
 * // Save on next
 * const handleNext = async () => {
 *   await save({ salary, salaryType });
 *   navigateToNextStep();
 * };
 * ```
 */
export const useVerifiableData = <T>(key: string, options?: VerifiableDataOptions) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const category = options?.category ?? VERIFIABLE_DATA_CATEGORY;

    const queryKey = ['useVerifiableData', key];

    const query = useQuery({
        queryKey,
        queryFn: async () => {
            const wallet = await initWallet();
            return getVerifiableData<T>(wallet, key);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const mutation = useMutation({
        mutationFn: async (data: T) => {
            const wallet = await initWallet();
            return storeVerifiableData(wallet, key, data, category);
        },
        onSuccess: (_, data) => {
            // Update the cache with the new data
            queryClient.setQueryData(queryKey, data);
        },
    });

    return {
        /** The current verifiable data, or undefined if not yet loaded or doesn't exist */
        data: query.data,
        /** Whether the data is being loaded */
        isLoading: query.isLoading,
        /** Whether data has been fetched (loading complete, regardless of result) */
        isFetched: query.isFetched,
        /** Save new data, replacing any existing credential */
        save: mutation.mutateAsync,
        /** Whether data is currently being saved */
        isSaving: mutation.isPending,
        /** Refetch the data from the server */
        refetch: query.refetch,
    };
};

/**
 * Helper function to get verifiable data outside of React components.
 * Useful for SSR or data prefetching.
 */
export const getVerifiableDataForKey = async <T>(
    wallet: BespokeLearnCard,
    key: string
): Promise<T | undefined> => {
    return getVerifiableData<T>(wallet, key);
};

/**
 * Helper function to save verifiable data outside of React components.
 */
export const saveVerifiableData = async <T>(
    wallet: BespokeLearnCard,
    key: string,
    data: T,
    category: string = VERIFIABLE_DATA_CATEGORY
): Promise<string> => {
    return storeVerifiableData(wallet, key, data, category);
};
