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

const MAX_LEARN_CLOUD_PAGE_ITERATIONS = 1000;

type SharedUriResolution = {
    sharedUri: string | false;
    status: 'reused' | 'created' | 'missing';
};

const getCredentialListQueryKey = (category: string) => [
    'useGetCredentialList',
    switchedProfileStore.get.switchedDid() ?? '',
    category,
];

export type ConsentDataAudience = string | string[];

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

/** Cache ciphertext by its entire effective audience; never by a single recipient. */
export const getConsentAudienceRecipients = (audience: ConsentDataAudience): string[] =>
    [
        ...new Set(
            (typeof audience === 'string' ? [audience] : audience).flatMap(getRecipientsForOwnerDid)
        ),
    ].sort();
export const getConsentAudienceCacheKey = (audience: ConsentDataAudience): string =>
    `audience:${JSON.stringify(getConsentAudienceRecipients(audience))}`;

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
    const seenCursors = new Set<string>();

    while (pageCount < MAX_LEARN_CLOUD_PAGE_ITERATIONS) {
        const page = (await getPage({ category }, { cursor, limit: 100 })) as
            CredentialListPage | undefined;

        pageCount += 1;

        if (!page) {
            break;
        }

        records.push(...(page.records ?? []));

        if (!page.hasMore || !page.cursor) {
            break;
        }

        if (seenCursors.has(page.cursor) || page.cursor === cursor) {
            break;
        }

        seenCursors.add(page.cursor);

        cursor = page.cursor;
    }

    return { records, pageCount };
};

const getOrCreateSharedUriFromCategoryRecords = async (
    wallet: BespokeLearnCard,
    contractOwnerDid: ConsentDataAudience,
    credUri: string,
    records: LCR[]
): Promise<SharedUriResolution> => {
    const audienceKey = getConsentAudienceCacheKey(contractOwnerDid);
    const mainRecord = records.find(
        record =>
            record.uri === credUri ||
            Object.values(record.sharedUris ?? {}).some(uris => uris.includes(credUri))
    );

    if (mainRecord) {
        const existingSharedUris = mainRecord.sharedUris?.[audienceKey];
        if (existingSharedUris?.length) {
            return { sharedUri: existingSharedUris.at(-1) ?? false, status: 'reused' };
        }

        const vc = await wallet.read.get(mainRecord.uri);
        if (!vc) {
            return { sharedUri: false, status: 'missing' };
        }

        const newUri = await wallet.store.LearnCloud.uploadEncrypted?.(vc, {
            recipients: getConsentAudienceRecipients(contractOwnerDid),
        });

        if (!newUri) {
            return { sharedUri: false, status: 'missing' };
        }

        const newSharedUris = mainRecord.sharedUris
            ? { ...mainRecord.sharedUris, [audienceKey]: [newUri] }
            : { [audienceKey]: [newUri] };

        await wallet.index.LearnCloud.update(mainRecord.id, {
            sharedUris: newSharedUris,
        });

        mainRecord.sharedUris = newSharedUris;

        return { sharedUri: newUri, status: 'created' };
    }

    return { sharedUri: false, status: 'missing' };
};

/**
 * In-flight shared URI creations, keyed by profile, credential, and full data audience.
 * Concurrent callers (e.g. the background contract sync worker and lazy
 * materialization in getCredentialById) await the same promise instead of
 * each uploading a shared URI, which would orphan all but the last one.
 */
const inFlightSharedUriCreations = new Map<string, Promise<string | false>>();
// Serialize index updates for the same source credential across different audiences.
const inFlightCredentialCreations = new Map<string, Promise<string | false>>();

export const getOrCreateSharedUriForWallet = async (
    wallet: BespokeLearnCard,
    contractOwnerDid: ConsentDataAudience,
    queryClient: QueryClient,
    credUri: string,
    category: string
): Promise<string | false> => {
    const didWeb = switchedProfileStore.get.switchedDid() ?? wallet.id?.did();
    const credentialKey = JSON.stringify([didWeb, credUri]);
    const inFlightKey = [didWeb, credUri, getConsentAudienceCacheKey(contractOwnerDid)]
        .filter(Boolean)
        .join('|');
    const inFlight = inFlightSharedUriCreations.get(inFlightKey);
    if (inFlight) return inFlight;

    const previous = inFlightCredentialCreations.get(credentialKey);
    const creation = Promise.resolve(previous)
        .catch(() => undefined)
        .then(() =>
            createSharedUriForWallet(wallet, contractOwnerDid, queryClient, credUri, category)
        )
        .finally(() => {
            inFlightSharedUriCreations.delete(inFlightKey);
            if (inFlightCredentialCreations.get(credentialKey) === creation)
                inFlightCredentialCreations.delete(credentialKey);
        });

    inFlightCredentialCreations.set(credentialKey, creation);
    inFlightSharedUriCreations.set(inFlightKey, creation);

    return creation;
};

const createSharedUriForWallet = async (
    wallet: BespokeLearnCard,
    contractOwnerDid: ConsentDataAudience,
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
    contractOwnerDid: ConsentDataAudience,
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

export const useSharedUrisInTerms = (contractOwnerDid: ConsentDataAudience) => {
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
