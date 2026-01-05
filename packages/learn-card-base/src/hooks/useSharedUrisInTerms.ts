import { ConsentFlowTerms } from '@learncard/types';
import { InfiniteData, QueryClient, useQueryClient } from '@tanstack/react-query';
import { switchedProfileStore, useWallet } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';
import { cloneDeep } from 'lodash';

export const getOrCreateSharedUriForWallet = async (
    wallet: BespokeLearnCard,
    contractOwnerDid: string,
    queryClient: QueryClient,
    credUri: string,
    category: string
): Promise<string | false> => {
    const didWeb = switchedProfileStore.get.switchedDid();
    const queryKey = ['useGetCredentialList', didWeb ?? '', category];
    const cache =
        queryClient.getQueryData<
            InfiniteData<{ records: LCR[]; hasMore: boolean; cursor?: string }, string>
        >(queryKey);

    for (const record of cache?.pages.flatMap(page => page.records) ?? []) {
        const alreadyShared =
            record.sharedUris && Object.keys(record.sharedUris).includes(contractOwnerDid);

        // Something with this logic is causing a bunch of duplicate shared uris
        //   So sacrificing perfomance for now in order to avoid this bug
        // in cache and already shared
        if (alreadyShared) {
            return record.sharedUris?.[contractOwnerDid].at(-1)!;
        }

        // it was already in react query cache, but not shared
        if (record.uri === credUri) {
            const vc = await wallet.read.get(credUri);
            if (!vc) return false;

            // For SmartResume we want to add the generic brain-service wallet's did so that the brain service
            // can decrypt the credentials and send them to SmartResume via their API
            const isSmartResume =
                contractOwnerDid ===
                    'did:web:network.learncard.com:users:smart-resume-integration' ||
                contractOwnerDid === 'did:web:localhost%3A4000:users:in-service' ||
                contractOwnerDid === 'did:web:localhost%3A4000:users:smart-resume' ||
                contractOwnerDid === 'did:web:staging.network.learncard.com' ||
                contractOwnerDid === 'did:web:localhost%3A4000:users:smart-resume-test';

            const recipients = [contractOwnerDid];
            console.log('contractOwnerDid', contractOwnerDid);
            if (isSmartResume) {
                recipients.push('did:web:staging.network.learncard.com');
                recipients.push('did:web:network.learncard.com');
                recipients.push('did:web:localhost%3A4000');
            }

            const newUri = await wallet.store.LearnCloud.uploadEncrypted?.(vc, {
                recipients,
            });

            if (!newUri) return false;

            const newSharedUris = record.sharedUris
                ? { ...record.sharedUris, [contractOwnerDid]: [newUri] }
                : { [contractOwnerDid]: [newUri] };

            await wallet.index.LearnCloud.update(record.id, {
                sharedUris: newSharedUris,
            });

            await queryClient.cancelQueries({ queryKey });
            // manually update react query
            queryClient.setQueriesData<InfiniteData<LCR, string>>({ queryKey }, oldData =>
                oldData
                    ? {
                          ...oldData,
                          pages: oldData.pages.map(oldPage => ({
                              ...oldPage,
                              records: oldPage.records.map(oldRecord => ({
                                  ...oldRecord,
                                  ...(oldRecord.uri === credUri && {
                                      sharedUris: newSharedUris,
                                  }),
                              })),
                          })),
                      }
                    : undefined
            );

            return newUri;
        }
    }

    // Not in react query cache, we gotta do this the hard way
    let oldCursor = cache?.pageParams.at(-1);
    let page = await wallet.index.LearnCloud.getPage?.(
        { category },
        { cursor: oldCursor } // start where the cache ended
    );

    do {
        await queryClient.cancelQueries({ queryKey });
        // update react query cache with this page
        queryClient.setQueriesData<InfiniteData<LCR, string>>({ queryKey }, oldData =>
            oldData
                ? {
                      pages: [...oldData.pages, page],
                      pageParams: [...oldData.pageParams, oldCursor],
                  }
                : {
                      pages: [page],
                      pageParams: [oldCursor],
                  }
        );

        const mainRecord = page?.records.find(record => record.uri === credUri);

        if (mainRecord) {
            // re-use existing shared uris if they exist
            const existingSharedUris = mainRecord.sharedUris?.[contractOwnerDid];
            if (existingSharedUris?.length > 0) {
                return existingSharedUris?.at(-1);
            }

            const vc = await wallet.read.get(credUri);
            if (!vc) return false;

            const newUri = await wallet.store.LearnCloud.uploadEncrypted?.(vc, {
                recipients: [contractOwnerDid],
            });
            if (!newUri) return false;

            await wallet.index.LearnCloud.update(mainRecord.id, {
                sharedUris: mainRecord.sharedUris
                    ? { ...mainRecord.sharedUris, [contractOwnerDid]: [newUri] }
                    : { [contractOwnerDid]: [newUri] },
            });

            return newUri;
        }

        // if credUri is already a sharedUri
        const alreadySharedRecord = page?.records.find(
            record =>
                record.sharedUris &&
                Object.keys(record.sharedUris).includes(contractOwnerDid) &&
                record.sharedUris[contractOwnerDid].includes(credUri)
        );

        if (alreadySharedRecord) {
            return alreadySharedRecord.sharedUris[contractOwnerDid].at(-1)!;
        }

        oldCursor = page?.cursor;
        page = await wallet.index.LearnCloud.getPage?.({ category }, { cursor: page?.cursor });
    } while (page?.hasMore);

    return false;
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
    await Promise.all(
        categories.map(async category => {
            const credUris = terms.terms.read.credentials.categories[category].shared;
            const newCredUris = (
                await Promise.all(
                    credUris?.map(
                        async credUri =>
                            await getOrCreateSharedUriForWallet(
                                wallet,
                                contractOwnerDid,
                                queryClient,
                                credUri,
                                category
                            )
                    ) ?? []
                )
            ).filter(c => c !== false);

            terms.terms.read.credentials.categories[category].shared = newCredUris;
        })
    );

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
