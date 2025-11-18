import { Capacitor } from '@capacitor/core';
import { initLearnCard } from '@learncard/init';
import { CredentialRecord } from '@learncard/types';
import { v4 as uuidv4 } from 'uuid';
import didkit from '@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url';

import { switchedProfileStore, walletStore } from 'learn-card-base/stores/walletStore';

import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { requireCurrentUserPrivateKey } from 'learn-card-base/helpers/privateKeyHelpers';
import { waitForSQLiteReady } from 'learn-card-base/SQL/sqliteReady';
import {
    getDefaultCategoryForCredential,
    isBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import {
    CredentialCategory,
    CredentialCategoryEnum,
    IndexMetadata,
} from 'learn-card-base/types/credentials';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { UnsignedVP, VC, Boost } from '@learncard/types';
import { InfiniteData, useQueryClient } from '@tanstack/react-query';
import { CredentialMetadata, LCR } from 'learn-card-base/types/credential-records';
import { getOrCreateSharedUriForWallet } from './useSharedUrisInTerms';
import { getOrFetchConsentedContracts } from './useConsentedContracts';

let generating = false; // Mutex flag to allow first init call to acquire a lock

/**
 * Get the category for a credential, with special handling for boost credentials.
 * For boost credentials, this resolves the boost and uses the boost's category
 * instead of the inner credential's category.
 */
export const getCategoryForCredential = async (
    credential: VC,
    wallet: BespokeLearnCard,
    mapAiCredentials = true
): Promise<CredentialCategory> => {
    // Check if this is a boost credential
    if (isBoostCredential(credential) && credential.boostId) {
        try {
            // Resolve the boost to get its category
            const boost = await wallet.invoke.getBoost(credential.boostId);

            if (boost?.category) {
                if (!mapAiCredentials) return boost.category as CredentialCategory;

                if (boost.category === 'ai-summary' || boost.category === 'summaryInfo') {
                    return CredentialCategoryEnum.aiSummary;
                } else if (boost.category === 'ai-topic' || boost.category === 'topicInfo') {
                    return CredentialCategoryEnum.aiTopic;
                } else if (
                    boost.category === 'ai-pathway' ||
                    boost.category === 'learningPathway'
                ) {
                    return CredentialCategoryEnum.aiPathway;
                } else if (boost.category === 'ai-assessment' || boost.category === 'assessment') {
                    return 'AI Assessment';
                }
                return boost.category as CredentialCategory;
            }
        } catch (error) {
            console.warn('Failed to resolve boost for categorization:', error);
            // Fall back to default categorization if boost resolution fails
        }
    }

    // For non-boost credentials or if boost resolution fails, use default categorization
    return getDefaultCategoryForCredential(credential) || 'Achievement';
};

export type BoostAndVCType = {
    boost: Boost;
    boostVC: VC;
};

type AddVCInput = Omit<LCR, 'id'>;
/*
Hook that servers as a simple wrapper exposing aspects of core wallet functionality
*/

// These modify the storage prototype to allow for storing an object in local storage
// It is temporary solution that will be removed in the near future
Storage.prototype.setObject = function (key: string, value: any) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function (key: string) {
    return JSON.parse(this.getItem(key) ?? '');
};

export const useWallet = () => {
    const isLoggedIn = useIsLoggedIn();
    const queryClient = useQueryClient();

    const getWallet = async (
        _privateKey?: string,
        didOverride?: string | true // true for parent user's did
    ): Promise<BespokeLearnCard> => {
        try {
            // Ensure SQLite is initialized on native before proceeding
            if (Capacitor.isNativePlatform()) {
                try {
                    await waitForSQLiteReady();
                } catch (readyErr) {
                    console.warn(
                        'Waiting for SQLite readiness failed; continuing anyway',
                        readyErr
                    );
                }
            }

            while (generating) await new Promise(res => setTimeout(res, 250));

            if (didOverride) {
                const privateKey = await requireCurrentUserPrivateKey(_privateKey);

                generating = true;
                const wallet = await getBespokeLearnCard(
                    privateKey,
                    didOverride === true ? undefined : didOverride
                );

                generating = false;
                return wallet;
            }

            const wallet = walletStore.get.wallet();

            if (!_privateKey && wallet) return wallet;

            generating = true;

            const privateKey = await requireCurrentUserPrivateKey(_privateKey);

            const newWallet = await getBespokeLearnCard(
                privateKey,
                _privateKey ? undefined : switchedProfileStore.get.switchedDid()
            );

            if (!_privateKey) walletStore.set.wallet(newWallet);

            generating = false;

            return newWallet;
        } catch (e: any) {
            generating = false;
            if (!e.message.includes('Error, no valid private key found')) {
                console.warn('Could not initialize wallet', e);
            } else {
                console.warn('No private key!');
            }

            console.warn('Could not initialize wallet', e);

            throw e instanceof Error ? e : new Error(String(e));
        }
    };

    const syncCredentialToContracts = async ({
        record,
        category,
    }: {
        record: LCR;
        category: CredentialCategory;
    }) => {
        const learnCard = await getWallet();
        // Fetch and cache all consented contracts for the user
        const allContracts = await getOrFetchConsentedContracts(queryClient, learnCard);
        // Batch sync credentials to contracts, respecting share settings
        await Promise.allSettled(
            allContracts.map(async ({ contract, terms, uri: termsUri, status }) => {
                if (status !== 'live') return;

                const categoryInfo = terms.read.credentials.categories[category];

                if (
                    categoryInfo &&
                    categoryInfo.shareAll &&
                    categoryInfo.sharing &&
                    (!categoryInfo.shareUntil || categoryInfo.shareUntil > new Date().toISOString())
                ) {
                    const sharedUri = await getOrCreateSharedUriForWallet(
                        learnCard,
                        contract.owner.did,
                        queryClient,
                        record.uri!,
                        category
                    );

                    if (sharedUri) {
                        await learnCard.invoke.syncCredentialsToContract(termsUri, {
                            [category]: [sharedUri],
                        });
                        queryClient.invalidateQueries({
                            queryKey: ['useTermsTransactions', termsUri],
                        });
                    }
                }
            })
        );
        return true;
    };

    const resolveCredential = async (uri: string) => {
        if (!uri) throw new Error('URI is required');

        if (isLoggedIn) {
            const wallet = await getWallet();

            return wallet.read.get(uri);
        }

        // fallback wallet when loading VCs
        const wallet = await initLearnCard({ seed: 'a', didkit });

        return wallet.read.get(uri);
    };

    const issueDIDAuthPresentation = async (challenge: string, domain?: string) => {
        if (!challenge) throw new Error('challenge is required');

        const wallet = await getWallet();

        const uvp: UnsignedVP = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: wallet.id.did(),
        };

        return wallet.invoke.issuePresentation(uvp, {
            challenge,
            domain,
            proofPurpose: 'authentication',
        });
    };

    const issueTestPresentationVc = async (challenge: string, domain?: string) => {
        if (!challenge) throw new Error('challenge is required');

        const wallet = await getWallet();

        return wallet.invoke.issuePresentation(await wallet.invoke.getTestVp(), {
            challenge,
            domain,
            proofPurpose: 'authentication',
        });
    };

    const publishContentToCeramic = async (
        credential: VC,
        location: 'SQLite' | 'LearnCloud' = 'LearnCloud'
    ) => {
        if (!credential) throw new Error('VC is required');

        const wallet = await getWallet();

        return wallet.store[location].upload(credential);
    };

    const publishEncryptedContentToCeramic = async (
        credential: VC,
        location: 'SQLite' | 'LearnCloud' = 'LearnCloud'
    ) => {
        if (!credential) throw new Error('VC is required');

        const wallet = await getWallet();

        return wallet?.store?.[location]?.uploadEncrypted?.(credential);
    };

    const storeAndAddVCToWallet = async (
        vc: VC,
        metadata: Partial<{ title: string; imgUrl: string }> = {},
        location: 'SQLite' | 'LearnCloud' = 'LearnCloud',
        skipLCNUser?: boolean // skip steps requiring a LCN account eg didweb
    ): Promise<{ result: boolean; credentialUri: string }> => {
        const { title, imgUrl } = metadata;
        const _id = vc.id || uuidv4();
        let returnUri;

        try {
            const wallet = await getWallet();

            const category = await getCategoryForCredential(vc, wallet);
            let result;

            if (skipLCNUser) {
                const uri2 = (await wallet.store.LearnCloud.uploadEncrypted?.(vc)) ?? '';
                const record = {
                    id: _id,
                    uri: uri2,
                    category,
                    ...(title ? { title } : {}),
                    ...(imgUrl ? { imgUrl } : {}),
                };

                result = await wallet.index[location].add(record);
                returnUri = uri2;
            }

            if (!skipLCNUser) {
                const uri = (await wallet.store.LearnCloud.uploadEncrypted?.(vc)) ?? '';

                const record = {
                    id: _id,
                    uri,
                    category,
                    ...(title ? { title } : {}),
                    ...(imgUrl ? { imgUrl } : {}),
                };

                result = await wallet.index[location].add(record);
                returnUri = uri;

                const didWeb = switchedProfileStore.get.switchedDid();

                if (result) {
                    await queryClient.cancelQueries({
                        queryKey: ['useGetCredentialList', didWeb ?? '', category],
                    });
                    queryClient.setQueryData<
                        InfiniteData<{
                            cursor?: string;
                            hasMore: boolean;
                            records: CredentialRecord<CredentialMetadata>[];
                        }>
                    >(['useGetCredentialList', didWeb ?? '', category], data => {
                        const firstPage = data?.pages[0];

                        if (firstPage) {
                            return {
                                ...data,
                                pages: [
                                    { ...firstPage, records: [record, ...firstPage.records] },
                                    ...(data?.pages.slice(1) ?? []),
                                ],
                            };
                        }

                        return {
                            pages: [{ hasMore: false, records: [record] }],
                            pageParams: [undefined],
                        };
                    });
                }
                await queryClient.cancelQueries({
                    queryKey: ['useGetCredentialCount', didWeb ?? '', category],
                });
                queryClient.setQueryData<number>(
                    ['useGetCredentialCount', didWeb ?? '', category],
                    currentCount => {
                        if (currentCount) return currentCount + 1;

                        return 1;
                    }
                );
                queryClient.refetchQueries({
                    queryKey: ['useGetCredentialList', didWeb ?? '', category],
                });
                queryClient.refetchQueries({
                    queryKey: ['useGetCredentialCount', didWeb ?? '', category],
                });

                if (!skipLCNUser) {
                    await syncCredentialToContracts({ record, category });
                }
            }

            return {
                result: result ?? false,
                credentialUri: returnUri ?? '',
            };
        } catch (e) {
            console.error(vc, e);
            throw e instanceof Error ? e : new Error(String(e));
        }
    };

    const storeAndAddManyVCsToWallet = async (
        vcs: VC[],
        location: 'SQLite' | 'LearnCloud' = 'LearnCloud'
    ) => {
        return Promise.all(
            vcs.map(async vc => (await storeAndAddVCToWallet(vc, {}, location)).result)
        );
    };

    // Adds a VC to wallet given a URI
    const addVCtoWallet = async (
        input: AddVCInput & { skipSync?: boolean },
        location: 'SQLite' | 'LearnCloud' = 'LearnCloud'
    ) => {
        const { uri, id, title, imgUrl, contractUri, skipSync } = input;
        let _id = id;
        if (!uri) throw new Error('No uri was provided, uri required');

        if (!id) _id = uuidv4();

        try {
            const wallet = await getWallet();

            const vc = await wallet.read.get(uri);

            if (!vc) throw new Error('No credential was found at the provided URI');

            const category = await getCategoryForCredential(vc as VC, wallet);

            const record = {
                id: _id,
                uri,
                category,
                ...(title ? { title } : {}),
                ...(imgUrl ? { imgUrl } : {}),
                ...(contractUri ? { contractUri } : {}),
                ...(vc?.boostId ? { boostUri: vc.boostId } : {}),
                __v: 1,
            };

            // get VC From stream given streamId
            // this does not return the added vc, it just adds the streamId to the wallet
            const result = await wallet.index[location].add(record);
            const didWeb = switchedProfileStore.get.switchedDid();

            if (result) {
                await queryClient.cancelQueries({
                    queryKey: ['useGetCredentialList', didWeb ?? '', category],
                });
                queryClient.setQueryData<
                    InfiniteData<{
                        cursor?: string;
                        hasMore: boolean;
                        records: CredentialRecord<CredentialMetadata>[];
                    }>
                >(['useGetCredentialList', didWeb ?? '', category], data => {
                    const firstPage = data?.pages[0];

                    if (firstPage) {
                        return {
                            ...data,
                            pages: [
                                { ...firstPage, records: [record, ...firstPage.records] },
                                ...(data?.pages.slice(1) ?? []),
                            ],
                        };
                    }

                    return {
                        pages: [{ hasMore: false, records: [record] }],
                        pageParams: [undefined],
                    };
                });
                await queryClient.cancelQueries({
                    queryKey: ['useGetCredentialCount', didWeb ?? '', category],
                });
                queryClient.setQueryData<number>(
                    ['useGetCredentialCount', didWeb ?? '', category],
                    currentCount => {
                        if (currentCount) return currentCount + 1;

                        return 1;
                    }
                );
                queryClient.refetchQueries({
                    queryKey: ['useGetCredentialList', didWeb ?? '', category],
                });
                queryClient.refetchQueries({
                    queryKey: ['useGetCredentialCount', didWeb ?? '', category],
                });

                if (!skipSync) {
                    await syncCredentialToContracts({ record, category });
                }
            }
            return result;
        } catch (e) {
            console.error(input, e);
            const msg = 'There was an error adding to the wallet';
            throw e instanceof Error
                ? new Error(`${msg}: ${e.message}`)
                : new Error(`${msg}: ${String(e)}`);
        }
    };

    const addManyVCsToWallet = async (
        input: (IndexMetadata & { uri: string; id?: string })[],
        location: 'SQLite' | 'LearnCloud' = 'LearnCloud'
    ) => {
        const mappedInput = input?.map(cred => {
            if (!cred.uri) throw new Error('URI is required');

            return {
                ...cred,
                id: cred.id || uuidv4(),
            };
        });

        try {
            const wallet = await getWallet();
            const res = await wallet.index[location].addMany?.(mappedInput);
            return res;
        } catch (e) {
            console.log('//Adding to wallet error', e);
            throw e;
        }
    };

    //Return a VC from wallet given a title
    const getVCFromWallet = async (
        title: string,
        location: 'SQLite' | 'LearnCloud' | 'all' = 'LearnCloud'
    ) => {
        if (!title) throw new Error('Title of VC is required');

        const wallet = await getWallet();

        const record = (await wallet.index[location].get<LCR>()).find(
            record => record.id === title
        );
        const vc = await wallet.read.get(record?.uri);

        return vc;
    };

    // Return a list of credentials in summary form (not the full credential object)
    const getCredentialsList = async (
        category?: CredentialCategory,
        location: 'SQLite' | 'LearnCloud' | 'all' = 'LearnCloud'
    ) => {
        const wallet = await getWallet();
        let credentials: LCR[] = [];

        if (category && category !== 'Achievement' && location === 'LearnCloud') {
            return wallet.index[location].get<LCR>({ category });
        }

        credentials = await wallet.index[location].get<LCR>();

        if (!category) return credentials;

        return credentials?.filter(
            credential => (credential.category || 'Achievement') === category
        );
    };

    // Get credentials from wallet
    // Should use the wrapped react query query instead if possible
    const getVCsFromWallet = async (
        category?: CredentialCategory,
        location: 'SQLite' | 'LearnCloud' | 'all' = 'LearnCloud'
    ): Promise<VC[]> => {
        /* const { data } = useGetCredentials();
        return data; */
        const wallet = await getWallet();

        // get list of credential uris
        if (!category) {
            const uris = (await wallet.index[location].get()).map(record => record.uri);

            const vcs = await Promise.all(uris.map(async uri => wallet.read.get(uri)));

            return vcs.filter((v): v is VC => Boolean(v));
        }

        const idxCredentials = await getCredentialsList(category);

        const resolvedCreds = (
            await Promise.all(
                idxCredentials.map(async credential => wallet.read.get(credential.uri))
            )
        ).filter((v): v is VC => Boolean(v));

        return resolvedCreds;
    };

    // Remove a specific credential
    const removeVCfromWallet = async (
        id: string,
        location: 'SQLite' | 'LearnCloud' = 'LearnCloud'
    ) => {
        const wallet = await getWallet();

        await wallet.index[location].remove(id);
    };

    // Remove all credentials
    const removeAllVCsFromWallet = async () => {
        const wallet = await getWallet();

        try {
            await Promise.all([
                wallet.index.SQLite?.removeAll?.(),
                wallet.index.LearnCloud.removeAll?.(),
            ]);

            return true;
        } catch (e) {
            console.log('removeAllVCsFromWallet::error', e);
            return false;
        }
    };

    // Stores a stream Id in localStorage to show on notification page for now
    const storeStreamIdInLocalStorage = (streamId: string) => {
        const streamIds = localStorage.getObject('streamIds') ?? [];
        const includesStreamId = streamIds?.includes(streamId);

        if (includesStreamId) {
            return false;
        }

        const newStreamIds = [streamId, streamIds];

        localStorage.setObject('streamIds', newStreamIds);

        return true;
    };

    // Get vc streamIds stored in localStorage
    const getStreamIdsInLocalStorage = () => localStorage.getObject('streamIds');

    // Remove streamId from localstorage
    const removeStreamIdFromLocalStorage = (streamId: string) => {
        const extantStreamids = (localStorage.getObject('streamIds') ?? []) as string[];
        const streamIdExists = extantStreamids.includes(streamId);

        if (streamIdExists) {
            const updatedStreamIds = extantStreamids.filter((id: string) => id !== streamId);

            localStorage.setObject('streamIds', updatedStreamIds);

            return true;
        }

        return false;
    };

    const installChapi = async () => {
        if (!Capacitor.isNativePlatform()) {
            const wallet = await getWallet();
            await wallet.invoke.installChapiHandler();
        }
    };

    const getDID = async () => {
        const wallet = await getWallet();
        try {
            return wallet.id.did();
        } catch (e) {
            console.log('getDID::error', e);
            return false;
        }
    };

    return {
        initWallet: getWallet,
        installChapi,
        getVCFromWallet,
        getVCsFromWallet,
        storeAndAddVCToWallet,
        storeAndAddManyVCsToWallet,
        addVCtoWallet,
        addManyVCsToWallet,
        resolveCredential,
        issueDIDAuthPresentation,
        publishContentToCeramic,
        publishEncryptedContentToCeramic,
        getCredentialsList,
        removeVCfromWallet,
        removeAllVCsFromWallet,
        storeStreamIdInLocalStorage,
        getStreamIdsInLocalStorage,
        removeStreamIdFromLocalStorage,
        issueTestPresentationVc,
        getDID,
        syncCredentialToContracts,
    };
};

export default useWallet;
