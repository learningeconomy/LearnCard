import { ConsentFlowTerms } from '@learncard/types';
import { InfiniteData, QueryClient, useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { cloneDeep } from 'lodash';
import { getLogger } from '../logging/logger';

const log = getLogger('use-shared-uris-in-terms');

type CredentialListPage = {
    records: LCR[];
    hasMore: boolean;
    cursor?: string;
};

type SharedUriResolution = {
    sharedUri: string | false;
    status: 'reused' | 'created' | 'missing';
};

const getCredentialListQueryKey = (category: string) => [
    'useGetCredentialList',
    switchedProfileStore.get.switchedDid() ?? '',
    category,
];

const getRecipientsForOwnerDid = (contractOwnerDid: string): string[] => {
    const isSmartResume =
        contractOwnerDid === 'did:web:network.learncard.com:users:smart-resume-integration' ||
        contractOwnerDid === 'did:web:localhost%3A4000:users:in-service' ||
        contractOwnerDid === 'did:web:localhost%3A4000:users:smart-resume' ||
        contractOwnerDid === 'did:web:localhost%3A4000:users:smart-resume-test';

    const recipients = [contractOwnerDid];
    if (isSmartResume) {
        recipients.push('did:web:network.learncard.com');
        recipients.push('did:web:localhost%3A4000');
    }

    return recipients;
};

const syncCachedCategoryRecords = (
    queryClient: QueryClient,
    category: string,
    records: LCR[]
): void => {
    const queryKey = getCredentialListQueryKey(category);
    const recordMap = new Map(records.map(record => [record.id, record]));

    queryClient.setQueriesData<InfiniteData<CredentialListPage, string>>({ queryKey }, oldData =>
        oldData
            ? {
                  ...oldData,
                  pages: oldData.pages.map(oldPage => ({
                      ...oldPage,
                      records: oldPage.records.map(oldRecord => {
                          const updatedRecord = recordMap.get(oldRecord.id);
                          return updatedRecord ?? oldRecord;
                      }),
                  })),
              }
            : oldData
    );
};

const loadCategoryRecordsForWallet = async (
    wallet: BespokeLearnCard,
    category: string
): Promise<{ records: LCR[]; pageCount: number }> => {
    const getPage = wallet.index.LearnCloud.getPage;

    if (!getPage) {
        const records = ((await wallet.index.LearnCloud.get({ category })) ?? []) as LCR[];
        return { records, pageCount: records.length > 0 ? 1 : 0 };
    }

    const records: LCR[] = [];
    let cursor: string | undefined = undefined;
    let pageCount = 0;

    while (true) {
        const page = (await getPage({ category }, { cursor, limit: 100 })) as
            | CredentialListPage
            | undefined;

        if (!page) {
            break;
        }

        pageCount += 1;
        records.push(...(page.records ?? []));

        if (!page.hasMore || !page.cursor) {
            break;
        }

        cursor = page.cursor;
    }

    return { records, pageCount };
};

const getOrCreateSharedUriFromCategoryRecords = async (
    wallet: BespokeLearnCard,
    contractOwnerDid: string,
    credUri: string,
    records: LCR[]
): Promise<SharedUriResolution> => {
    const mainRecord = records.find(record => record.uri === credUri);

    if (mainRecord) {
        const existingSharedUris = mainRecord.sharedUris?.[contractOwnerDid];
        if (existingSharedUris?.length) {
            return { sharedUri: existingSharedUris.at(-1) ?? false, status: 'reused' };
        }

        const vc = await wallet.read.get(credUri);
        if (!vc) {
            return { sharedUri: false, status: 'missing' };
        }

        const newUri = await wallet.store.LearnCloud.uploadEncrypted?.(vc, {
            recipients: getRecipientsForOwnerDid(contractOwnerDid),
        });

        if (!newUri) {
            return { sharedUri: false, status: 'missing' };
        }

        const newSharedUris = mainRecord.sharedUris
            ? { ...mainRecord.sharedUris, [contractOwnerDid]: [newUri] }
            : { [contractOwnerDid]: [newUri] };

        await wallet.index.LearnCloud.update(mainRecord.id, {
            sharedUris: newSharedUris,
        });

        mainRecord.sharedUris = newSharedUris;

        return { sharedUri: newUri, status: 'created' };
    }

    const alreadySharedRecord = records.find(record => {
        const sharedUris = record.sharedUris?.[contractOwnerDid];
        return sharedUris?.includes(credUri);
    });

    if (alreadySharedRecord) {
        return {
            sharedUri: alreadySharedRecord.sharedUris?.[contractOwnerDid]?.at(-1) ?? false,
            status: 'reused',
        };
    }

    return { sharedUri: false, status: 'missing' };
};

export const getOrCreateSharedUriForWallet = async (
    wallet: BespokeLearnCard,
    contractOwnerDid: string,
    queryClient: QueryClient,
    credUri: string,
    category: string
): Promise<string | false> => {
    const queryKey = getCredentialListQueryKey(category);
    const cache = queryClient.getQueryData<InfiniteData<CredentialListPage, string>>(queryKey);
    const cachedRecords = cache?.pages.flatMap(page => page.records) ?? [];

    if (cachedRecords.length > 0) {
        const cachedResult = await getOrCreateSharedUriFromCategoryRecords(
            wallet,
            contractOwnerDid,
            credUri,
            cachedRecords
        );

        if (cachedResult.status !== 'missing') {
            syncCachedCategoryRecords(queryClient, category, cachedRecords);
            return cachedResult.sharedUri;
        }
    }

    const { records } = await loadCategoryRecordsForWallet(wallet, category);
    const result = await getOrCreateSharedUriFromCategoryRecords(
        wallet,
        contractOwnerDid,
        credUri,
        records
    );

    syncCachedCategoryRecords(queryClient, category, records);
    return result.sharedUri;
};

export const getTermsWithSharedUrisForWallet = async (
    wallet: BespokeLearnCard,
    contractOwnerDid: string,
    queryClient: QueryClient,
    _terms: {
        terms: ConsentFlowTerms;
        expiresAt?: string;
        oneTime?: boolean;
    }
) => {
    const terms = cloneDeep(_terms);
    const categories = Object.keys(terms.terms.read.credentials.categories);
    const totalCredentialUris = categories.reduce(
        (count, category) =>
            count + (terms.terms.read.credentials.categories[category].shared?.length ?? 0),
        0
    );

    log.debug('Preparing shared URIs for consent terms', {
        categoryCount: categories.length,
        totalCredentialUris,
    });

    for (const category of categories) {
        const requestedCredUris = Array.from(
            new Set(terms.terms.read.credentials.categories[category].shared ?? [])
        );

        if (requestedCredUris.length === 0) {
            terms.terms.read.credentials.categories[category].shared = [];
            continue;
        }

        const { records, pageCount } = await loadCategoryRecordsForWallet(wallet, category);
        let reusedCount = 0;
        let createdCount = 0;
        let missingCount = 0;
        const newCredUris: string[] = [];

        for (const credUri of requestedCredUris) {
            const result = await getOrCreateSharedUriFromCategoryRecords(
                wallet,
                contractOwnerDid,
                credUri,
                records
            );

            if (result.status === 'reused' && result.sharedUri) {
                reusedCount += 1;
                newCredUris.push(result.sharedUri);
            } else if (result.status === 'created' && result.sharedUri) {
                createdCount += 1;
                newCredUris.push(result.sharedUri);
            } else {
                missingCount += 1;
            }
        }

        syncCachedCategoryRecords(queryClient, category, records);
        terms.terms.read.credentials.categories[category].shared = newCredUris;

        log.debug('Prepared shared URIs for category', {
            category,
            requestedCount: requestedCredUris.length,
            matchedRecordCount: records.length,
            pageCount,
            reusedCount,
            createdCount,
            missingCount,
        });
    }

    return terms;
};

export const useSharedUrisInTerms = (contractOwnerDid: string) => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return {
        getTermsWithSharedUris: async (_terms: {
            terms: ConsentFlowTerms;
            expiresAt?: string;
            oneTime?: boolean;
        }) => {
            const wallet = await initWallet();
            return getTermsWithSharedUrisForWallet(wallet, contractOwnerDid, queryClient, _terms);
        },
    };
};
