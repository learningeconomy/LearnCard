import React, { useState, useEffect, useRef } from 'react';
import { ShareCredentialPicker } from '../../../components/share-links/ShareCredentialPicker';
import { ShareCredentialsIllustration } from '../../../components/share-links/ShareCredentialsIllustration';
import { credentialText } from '../../../components/share-links/shareLinkFlow';
import VCToShare from '../VCToShare';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { getLogger } from 'learn-card-base';
const log = getLogger('vpr-query-by-example');

import {
    CurrentUser,
    ModalTypes,
    useModal,
    isVerifiableDataRecord,
    useGetCredentialList,
    useGetResolvedCredentials,
} from 'learn-card-base';

import {
    isAiContractCategory,
    isVerifiableDataContractCategory,
} from '../../../helpers/contract.helpers';

import { getUniqueId } from 'learn-card-base/helpers/credentials/ids';

import { chapiStore, redirectStore } from 'learn-card-base';

import { IonPage, IonContent } from '@ionic/react';

import { queryListOfCredentials } from 'learn-card-base/helpers/credentials/queries';
import { filterMaybes } from '@learncard/helpers';
import type { CredentialRequestEvent } from '@learncard/chapi-plugin';
import type {
    VerifierPresentationRequest,
    CredentialDisclosureSubmit,
} from '../../../helpers/verifier-history/disclosure';
import * as m from '../../../paraglide/messages.js';

export type VprQueryByExampleProps = {
    event?: CredentialRequestEvent;
    verifiablePresentationRequest?: VerifierPresentationRequest;
    onSubmit?: CredentialDisclosureSubmit;
    onReject?: () => void;
    currentUser: CurrentUser | null;
};

const VprQueryByExample: React.FC<VprQueryByExampleProps> = ({
    event,
    onSubmit,
    onReject,
    currentUser,
    verifiablePresentationRequest,
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [selectedOnly, setSelectedOnly] = useState(false);
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.Center,
    });

    const [selectedVcs, setSelectedVcs] = useState<string[]>([]);
    const [error, setError] = useState<string>('');
    const [searchInput, setSearchInput] = useState('');

    /**
     * After the first page has finished loading, we'd like to auto-select suggested credentials for
     * the user, however we _don't_ ever want to do it again after that, so we need this flag to
     * ensure that we only suggest credentials one time.
     */
    const [hasSuggested, setHasSuggested] = useState(false);

    const {
        data: records,
        isLoading: credentialsLoading,
        error: credentialListError,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useGetCredentialList();

    const credentialQuery =
        event?.credentialRequestOptions?.web?.VerifiablePresentation?.query ||
        verifiablePresentationRequest?.query ||
        [];

    const allRecords = records?.pages?.flatMap(page => page?.records) ?? [];

    const resolvedCredentials = useGetResolvedCredentials(allRecords.map(record => record?.uri));

    const allCredentials = resolvedCredentials.map((vc, index) => {
        const category: string =
            allRecords[index]?.category ||
            (vc.data && getDefaultCategoryForCredential(vc.data)) ||
            'Achievement';
        return {
            vc: vc.data,
            loading: vc.isLoading,
            record: allRecords[index],
            category,
        };
    });

    const eligibleCredentials = allCredentials.filter(credential => {
        if (!credential.record?.uri || credential.category === 'Hidden') return false;
        if (isVerifiableDataRecord(credential.record)) return false;
        if (isVerifiableDataContractCategory(credential.category)) return false;
        if (isAiContractCategory(credential.category)) return false;
        return credential.loading || Boolean(credential.vc);
    });
    const categories = [...new Set(eligibleCredentials.map(credential => credential.category))];
    const selectedCategoryCount = new Set(
        eligibleCredentials
            .filter(credential => credential.vc && selectedVcs.includes(getUniqueId(credential.vc)))
            .map(credential => credential.category)
    ).size;
    const search = searchInput.trim().toLowerCase();
    const choices = eligibleCredentials
        .filter(credential => {
            if (selectedOnly)
                return credential.vc && selectedVcs.includes(getUniqueId(credential.vc));
            if (categoryFilter && credential.category !== categoryFilter) return false;
            return (
                !search ||
                credentialText(credential.vc).name.toLowerCase().includes(search) ||
                credential.record.title?.toLowerCase().includes(search)
            );
        })
        .map(credential => ({
            ...credential.record,
            uri: credential.vc ? getUniqueId(credential.vc) : credential.record.uri,
            credential: credential.vc,
            category: credential.category,
        }));

    const vcsToShare = resolvedCredentials
        .filter(vc => {
            return vc.data && selectedVcs.includes(getUniqueId(vc.data));
        })
        .map(vc => vc.data!);

    const allCredentialsFinishedLoading = resolvedCredentials.every(result => !result.isLoading);

    const handleVcSelection = (id: string) => {
        setSelectedVcs(current =>
            current.includes(id) ? current.filter(n => n !== id) : [...current, id]
        );
    };

    const isVcSelected = (id: string) => vcsToShare.some(vc => getUniqueId(vc) === id);

    const presentReview = () =>
        newModal(
            <VCToShare
                vcsToShare={vcsToShare}
                categoriesById={Object.fromEntries(
                    eligibleCredentials
                        .filter(item => item.vc)
                        .map(item => [getUniqueId(item.vc!), item.category])
                )}
                handleCloseModal={closeModal}
                handleVcSelection={handleVcSelection}
                isVcSelected={isVcSelected}
                event={event}
                onSubmit={onSubmit}
                onReject={onReject}
                verifiablePresentationRequest={verifiablePresentationRequest}
                currentUser={currentUser}
                getUniqueId={getUniqueId}
            />,
            { sectionClassName: 'verifier-review-modal' }
        );

    const reject = () => {
        try {
            chapiStore.set.isChapiInteraction(null);
            redirectStore.set.authRedirect(null);
        } catch (e) {
            log.error(e);
            setError('Error rejecting credentials. Please try again.');
        }
        if (event) {
            event.respondWith(Promise.resolve(null));
        }
        if (onReject) {
            onReject();
        }
    };

    useEffect(() => {
        // Search across every index page; filtering never changes the selected batch.
        if (search && hasNextPage && !isFetchingNextPage && !credentialListError) {
            void fetchNextPage();
        }
    }, [search, fetchNextPage, hasNextPage, isFetchingNextPage, credentialListError]);

    useEffect(() => {
        if (!selectedVcs.length) setSelectedOnly(false);
    }, [selectedVcs]);

    useEffect(() => {
        if (credentialListError) setError('Error loading credentials. Please try again.');
    }, [credentialListError]);

    useEffect(() => {
        if (hasSuggested || !allCredentialsFinishedLoading || credentialQuery.length === 0) {
            return;
        }

        const suggestedCreds = queryListOfCredentials(
            filterMaybes(eligibleCredentials.map(credential => credential.vc)),
            credentialQuery
        );

        setSelectedVcs(suggestedCreds.map(getUniqueId));
        setHasSuggested(true);
    }, [allCredentialsFinishedLoading, hasSuggested, credentialQuery, eligibleCredentials]);

    return (
        <IonPage>
            <IonContent fullscreen>
                <section
                    className="sentry-block ph-no-capture flex min-h-full flex-col bg-white font-poppins text-grayscale-900"
                    data-html2canvas-ignore
                    data-feedback-exclude
                >
                    <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-6 py-8 md:py-12">
                        <ShareCredentialsIllustration />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                                {m['shareLinks.choose']()}
                            </h1>
                            <p className="mt-3 text-sm text-grayscale-600 leading-relaxed">
                                {m['verifierSelection.hint']()}
                            </p>
                        </div>
                        {error && (
                            <p
                                role="alert"
                                className="rounded-2xl bg-red-50 p-4 text-sm text-red-700"
                            >
                                {m['shareLinks.error']()}
                            </p>
                        )}
                        <ShareCredentialPicker
                            filtered={choices}
                            selected={selectedVcs}
                            onToggle={handleVcSelection}
                            onDeselectAll={() => setSelectedVcs([])}
                            selectedOnly={selectedOnly}
                            setSelectedOnly={setSelectedOnly}
                            selectedCategoryCount={selectedCategoryCount}
                            search={searchInput}
                            setSearch={setSearchInput}
                            onClearSearch={() => setSearchInput('')}
                            searchInput={searchInputRef}
                            settledSearch={searchInput}
                            searchPending={Boolean(search && (hasNextPage || isFetchingNextPage))}
                            categoryFilter={categoryFilter}
                            setCategoryFilter={setCategoryFilter}
                            categories={categories}
                            indexReady={!credentialsLoading}
                            loading={credentialsLoading || isFetchingNextPage}
                            failedReads={new Set()}
                        />
                        {hasNextPage && (
                            <button
                                type="button"
                                className="rounded-[20px] border border-solid border-grayscale-300 bg-white px-5 py-3 text-sm font-medium text-grayscale-700 hover:bg-grayscale-10 disabled:opacity-40"
                                disabled={isFetchingNextPage}
                                onClick={() => void fetchNextPage()}
                            >
                                {isFetchingNextPage
                                    ? m['shareLinks.loading']()
                                    : m['shareLinks.loadMore']()}
                            </button>
                        )}
                    </div>
                    <footer className="sticky bottom-0 shrink-0 border-t border-grayscale-200 bg-white">
                        <div className="mx-auto flex w-full max-w-2xl items-center justify-end gap-3 px-6 py-4">
                            <button
                                type="button"
                                onClick={reject}
                                className="rounded-[20px] border border-solid border-grayscale-300 bg-white px-5 py-3 text-sm font-medium text-grayscale-700 hover:bg-grayscale-10 focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                {m['common.cancel']()}
                            </button>
                            <button
                                type="button"
                                onClick={presentReview}
                                disabled={vcsToShare.length === 0}
                                className="rounded-[20px] bg-grayscale-900 px-5 py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                {m['verifierSelection.review']()}
                            </button>
                        </div>
                    </footer>
                </section>
            </IonContent>
        </IonPage>
    );
};

export default VprQueryByExample;
