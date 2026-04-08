import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWallet } from './useWallet';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { LCR } from 'learn-card-base/types/credential-records';
import type { UnsignedVC } from '@learncard/types';

const VERIFIABLE_DATA_CATEGORY = 'VerifiableData';

export type VerifiableDataOptions = {
    /** Optional credential category. Defaults to 'VerifiableData' */
    category?: string;

    /** Optional human-readable credential name (VC v2 top-level field). Useful if the credential may be shared via ConsentFlow. */
    name?: string;

    /** Optional human-readable credential description (VC v2 top-level field). Useful if the credential may be shared via ConsentFlow. */
    description?: string;
};

type VerifiableDataRecord<T> = LCR & {
    verifiableData?: T;
    issuanceDate?: string;
};

/**
 * Inline JSON-LD context for VerifiableData credentials.
 * Uses @json type so the payload is preserved as a native JSON literal
 * without needing to stringify/parse.
 */
const VERIFIABLE_DATA_CONTEXT = {
    VerifiableData: 'https://docs.learncard.com/schemas/credentials/verifiable-data#VerifiableData',
    dataKey: 'https://docs.learncard.com/schemas/credentials/verifiable-data#dataKey',
    dataPayload: {
        '@id': 'https://docs.learncard.com/schemas/credentials/verifiable-data#dataPayload',
        '@type': '@json',
    },
} as const;

/**
 * Creates a simple self-issued VC v2 credential containing arbitrary data.
 * The data is stored as a native JSON literal via the @json-typed dataPayload field.
 */
const createVerifiableDataCredential = async <T>(
    wallet: BespokeLearnCard,
    key: string,
    data: T,
    options?: Pick<VerifiableDataOptions, 'name' | 'description'>
) => {
    const did = wallet.id.did();
    const validFrom = new Date().toISOString();

    const unsignedCredential: UnsignedVC = {
        '@context': ['https://www.w3.org/ns/credentials/v2', VERIFIABLE_DATA_CONTEXT],
        type: ['VerifiableCredential', 'VerifiableData'],
        issuer: did,
        validFrom,
        ...(options?.name && { name: options.name }),
        ...(options?.description && { description: options.description }),
        credentialSubject: {
            id: did,
            dataKey: key,
            dataPayload: data,
        },
    };

    return wallet.invoke.issueCredential(unsignedCredential);
};

/**
 * Stores a verifiable data credential and indexes it.
 * If a record already exists for this key, it is updated in place.
 * Otherwise a new index record is created.
 */
const storeVerifiableData = async <T>(
    wallet: BespokeLearnCard,
    key: string,
    data: T,
    category: string,
    options?: Pick<VerifiableDataOptions, 'name' | 'description'>
): Promise<string> => {
    const indexId = `__verifiable_data_${key}__`;

    // Check whether an index record already exists for this key
    const existingRecords = await wallet.index.LearnCloud.get<VerifiableDataRecord<T>>({
        id: indexId,
    });

    // Create and sign the credential
    const credential = await createVerifiableDataCredential(wallet, key, data, options);

    // Store the credential blob
    const uri = await wallet.store.LearnCloud.uploadEncrypted?.(credential);

    if (!uri) throw new Error('Failed to store verifiable data credential.');

    // Use the credential's own validFrom as the canonical timestamp
    const issuanceDate = credential.validFrom ?? new Date().toISOString();

    if (existingRecords?.length > 0) {
        // Update the existing index record in place
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await wallet.index.LearnCloud.update(indexId, {
            uri,
            category,
            title: `VerifiableData: ${key}`,
            verifiableData: data as any,
            issuanceDate,
        });
    } else {
        // First write for this key — create a new index record
        await wallet.index.LearnCloud.add<VerifiableDataRecord<T>>({
            uri,
            id: indexId,
            category,
            title: `VerifiableData: ${key}`,
            verifiableData: data,
            issuanceDate,
        });
    }

    return uri;
};

type VerifiableDataResult<T> = {
    data: T | undefined;
    issuanceDate: string | undefined;
};

/**
 * Retrieves verifiable data for a given key.
 */
const getVerifiableData = async <T>(
    wallet: BespokeLearnCard,
    key: string
): Promise<VerifiableDataResult<T>> => {
    const records = await wallet.index.LearnCloud.get<VerifiableDataRecord<T>>({
        id: `__verifiable_data_${key}__`,
    });

    if (records?.length > 0 && records[0].verifiableData !== undefined) {
        // Return the data from the index record directly (faster)
        return {
            data: records[0].verifiableData,
            issuanceDate: records[0].issuanceDate,
        };
    }

    // Fallback: read the dataPayload directly from the credential
    if (records?.length > 0 && records[0].uri) {
        try {
            const credential = await wallet.read.get(records[0].uri);

            const subject = Array.isArray(credential?.credentialSubject)
                ? credential.credentialSubject[0]
                : credential?.credentialSubject;

            if (subject?.dataPayload !== undefined) {
                return {
                    data: subject.dataPayload as T,
                    issuanceDate: credential?.validFrom ?? records[0].issuanceDate,
                };
            }
        } catch (e) {
            console.warn('Failed to read verifiable data credential:', e);
        }
    }

    return { data: undefined, issuanceDate: undefined };
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

    const credentialOptions = {
        ...(options?.name && { name: options.name }),
        ...(options?.description && { description: options.description }),
    };

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<VerifiableDataResult<T>> => {
            const wallet = await initWallet();
            return getVerifiableData<T>(wallet, key);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const mutation = useMutation({
        mutationFn: async (data: T) => {
            const wallet = await initWallet();
            return storeVerifiableData(wallet, key, data, category, credentialOptions);
        },
        onMutate: async (data: T) => {
            await queryClient.cancelQueries({ queryKey });

            const previousData = queryClient.getQueryData<VerifiableDataResult<T>>(queryKey);

            queryClient.setQueryData<VerifiableDataResult<T>>(queryKey, current => ({
                data,
                issuanceDate: current?.issuanceDate ?? new Date().toISOString(),
            }));

            return { previousData };
        },
        onError: (_error, _data, context) => {
            queryClient.setQueryData(queryKey, context?.previousData);
        },
        onSuccess: (_, data) => {
            // Update the cache with the new data
            queryClient.setQueryData(queryKey, {
                data,
                issuanceDate: new Date().toISOString(),
            });
        },
    });

    /**
     * Check if new data differs from existing data.
     * Uses JSON serialization for deep comparison.
     */
    const hasChanged = (newData: T): boolean => {
        if (query.data?.data === undefined) return true;
        return JSON.stringify(query.data.data) !== JSON.stringify(newData);
    };

    /**
     * Save data only if it has changed from the existing data.
     * Returns true if data was saved, false if skipped.
     */
    const saveIfChanged = async (newData: T): Promise<boolean> => {
        if (!hasChanged(newData)) {
            return false;
        }
        await mutation.mutateAsync(newData);
        return true;
    };

    return {
        /** The current verifiable data, or undefined if not yet loaded or doesn't exist */
        data: query.data?.data,
        /** The issuance date of the credential, or undefined if not yet loaded */
        issuanceDate: query.data?.issuanceDate,
        /** Whether the data is being loaded */
        isLoading: query.isLoading,
        /** Whether data has been fetched (loading complete, regardless of result) */
        isFetched: query.isFetched,
        /** Save new data, replacing any existing credential */
        save: mutation.mutateAsync,
        /** Save new data only if it differs from existing data. Returns true if saved. */
        saveIfChanged,
        /** Check if new data differs from existing data */
        hasChanged,
        /** Whether data is currently being saved */
        isSaving: mutation.isPending,
        /** Refetch the data from the server */
        refetch: query.refetch,
        /** Whether data exists (has been saved at least once) */
        exists: query.data?.data !== undefined,
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
    const result = await getVerifiableData<T>(wallet, key);
    return result.data;
};

/**
 * Helper function to save verifiable data outside of React components.
 */
export const saveVerifiableData = async <T>(
    wallet: BespokeLearnCard,
    key: string,
    data: T,
    options?: Pick<VerifiableDataOptions, 'category' | 'name' | 'description'>
): Promise<string> => {
    const category = options?.category ?? VERIFIABLE_DATA_CATEGORY;

    return storeVerifiableData(wallet, key, data, category, options);
};
