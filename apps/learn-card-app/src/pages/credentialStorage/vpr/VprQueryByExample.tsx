import React, { useState, useEffect, useRef } from 'react';
import BoostEarnedCard from 'apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedCard';
import VCToShare from '../VCToShare';
import './VprQueryByExample.scss';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';
import { getLogger } from 'learn-card-base';
const log = getLogger('vpr-query-by-example');

import {
    CredentialCategoryEnum,
    CurrentUser,
    categoryMetadata,
    isVerifiableDataRecord,
    useGetCredentialList,
    useGetResolvedCredentials,
} from 'learn-card-base';

import {
    isAiContractCategory,
    isVerifiableDataContractCategory,
} from '../../../helpers/contract.helpers';

import { getUniqueId } from 'learn-card-base/helpers/credentials/ids';

import { LoadingSpinner } from 'learn-card-base/components/loaders/LoadingSpinner';

import { chapiStore, redirectStore } from 'learn-card-base';

import {
    IonPage,
    IonContent,
    IonRow,
    IonCol,
    IonSpinner,
    IonGrid,
    IonSearchbar,
    useIonModal,
} from '@ionic/react';

import { queryListOfCredentials } from 'learn-card-base/helpers/credentials/queries';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import { filterMaybes } from '@learncard/helpers';
import type { CredentialRequestEvent } from '@learncard/chapi-plugin';
import type { VP } from '@learncard/types';
import * as m from '../../../paraglide/messages.js';

export type VprQueryByExampleProps = {
    event?: CredentialRequestEvent;
    verifiablePresentationRequest?: any;
    onSubmit?: (body: { verifiablePresentation: VP }) => void;
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
    const infiniteScrollRef = useRef<HTMLDivElement>(null);

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
    } = useGetCredentialList();

    const onScreen = useOnScreen(infiniteScrollRef as any, '-200px', [
        records?.pages?.[0]?.records?.length,
    ]);

    const credentialQuery =
        event?.credentialRequestOptions?.web?.VerifiablePresentation?.query ||
        verifiablePresentationRequest?.query ||
        [];

    const allRecords = records?.pages?.flatMap(page => page?.records) ?? [];

    const resolvedCredentials = useGetResolvedCredentials(allRecords.map(record => record?.uri));

    const allCredentials = resolvedCredentials.map((vc, index) => ({
        vc: vc.data,
        loading: vc.isLoading,
        record: allRecords[index],
        category:
            allRecords[index]?.category ||
            (vc.data && getDefaultCategoryForCredential(vc.data)) ||
            'Achievement',
    }));

    const vcsToDisplay = allCredentials.filter(credential => {
        if (credential.category === 'Hidden') return false;
        // Internal "My Skills Profile" data is self-issued verifiable data, not shareable credentials — exclude it like the wallet does.
        if (isVerifiableDataRecord(credential.record)) return false;
        if (isVerifiableDataContractCategory(credential.category)) return false;
        // AI session/pathway metadata isn't a real credential and isn't shown in the wallet grid.
        if (isAiContractCategory(credential.category)) return false;
        if (!credential.loading && !credential.vc) return false;

        if (!searchInput) return true;

        return (
            credential.vc?.boostCredential?.name.toLowerCase().includes(searchInput) ||
            credential.vc?.name?.toLowerCase().includes(searchInput) ||
            credential.vc?.credentialSubject?.achievement?.name?.toLowerCase().includes(searchInput)
        );
    });

    const vcsToShare = resolvedCredentials
        .filter(vc => {
            return vc.data && selectedVcs.includes(getUniqueId(vc.data));
        })
        .map(vc => vc.data!);

    const allCredentialsFinishedLoading = resolvedCredentials.every(result => !result.isLoading);

    const handleVcSelection = (id: string) => {
        if (selectedVcs.includes(id)) setSelectedVcs(selectedVcs.filter(n => n !== id));
        else setSelectedVcs([...selectedVcs, id]);
    };

    const isVcSelected = (id: String) => vcsToShare.some(vc => getUniqueId(vc) === id);

    const [presentModal, dismissModal] = useIonModal(VCToShare, {
        vcsToShare: vcsToShare,
        handleCloseModal: () => dismissModal(),
        handleVcSelection: handleVcSelection,
        isVcSelected: isVcSelected,
        event: event,
        onSubmit: onSubmit,
        onReject: onReject,
        verifiablePresentationRequest: verifiablePresentationRequest,
        currentUser: currentUser,
        getUniqueId: getUniqueId,
    });

    const renderCredentialList = vcsToDisplay?.map(credential => {
        if (!credential.record?.uri) return <></>;

        const categoryImgUrl =
            categoryMetadata[credential.category as CredentialCategoryEnum].defaultImageSrc;
        const uniqueId = credential.vc ? getUniqueId(credential.vc) : credential.record.uri;

        return (
            <BoostEarnedCard
                key={credential.record.id}
                credential={credential.vc}
                record={credential.record}
                defaultImg={categoryImgUrl}
                categoryType={credential.category}
                verifierState={true}
                showChecked={true}
                onCheckMarkClick={() => handleVcSelection(uniqueId)}
                initialCheckmarkState={isVcSelected(uniqueId)}
            />
        );
    });

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
        if (onScreen && hasNextPage) fetchNextPage();
    }, [fetchNextPage, hasNextPage, onScreen]);

    useEffect(() => {
        if (credentialListError) setError('Error loading credentials. Please try again.');
    }, [credentialListError]);

    useEffect(() => {
        if (hasSuggested || !allCredentialsFinishedLoading || credentialQuery.length === 0) {
            return;
        }

        const suggestedCreds = queryListOfCredentials(
            filterMaybes(vcsToDisplay.map(credential => credential.vc)),
            credentialQuery
        );

        setSelectedVcs(suggestedCreds.map(getUniqueId));
        setHasSuggested(true);
    }, [allCredentialsFinishedLoading, hasSuggested, credentialQuery, vcsToDisplay]);

    return (
        <IonPage>
            <IonContent fullscreen>
                <IonRow className="bg-grayscale-100 w-full flex items-center justify-center h-full">
                    <IonCol className="text-center p-0 h-full pt-[env(safe-area-inset-top)]">
                        {!credentialsLoading && (
                            <h1 className="md:text-5xl mobile:text-4xl text-left m-5 md:ml-[5%] min-[1400px]:ml-[100px] text-grayscale-900 font-poppins font-bold">
                                Select Credentials
                            </h1>
                        )}
                        <h2
                            className={
                                credentialsLoading
                                    ? 'mt-[80px] font-normal text-2xl text-grayscale-900 font-poppins'
                                    : 'text-left m-5 md:ml-[5%] min-[1400px]:ml-[100px] font-normal text-2xl text-grayscale-900 font-poppins'
                            }
                        >
                            {credentialsLoading
                                ? m['common.loadingVerifiableCredentials']()
                                : 'Select the verifiable credentials you would like to share.'}
                        </h2>
                        {credentialsLoading && (
                            <div className="relative w-full text-center flex flex-col items-center justify-center">
                                <div className="max-w-[500px]">
                                    <LoadingSpinner className="h-full w-full" />
                                </div>
                            </div>
                        )}
                        {!credentialsLoading && allRecords.length > 0 && (
                            <div className="bg-grayscale-100">
                                <IonSearchbar
                                    class="custom-search-bar md:max-w-[90%] min-[1400px]:max-w-[925px] md:ml-[5%] min-[1400px]:ml-[100px]"
                                    placeholder="Search..."
                                    onIonInput={e =>
                                        setSearchInput(e.target.value?.toLowerCase() ?? '')
                                    }
                                />
                                <IonGrid className="max-w-[1000px] min-[1400px]:ml-[65px]">
                                    <IonRow className="p-0 flex flex-row items-center flex-wrap w-full mb-60 xl:mb-64 achievements-list-container">
                                        {renderCredentialList}
                                        <div role="presentation" ref={infiniteScrollRef} />
                                    </IonRow>
                                </IonGrid>
                                <footer className="fixed bottom-0 w-full desktop:bottom-5 desktop:right-10 desktop:w-[520px] z-9999 bg-white border-t border-grayscale-200 desktop:border desktop:rounded-[20px] shadow-footer desktop:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.10)] font-poppins">
                                    <div className="mx-auto w-full max-w-[720px] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] desktop:py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="text-center sm:text-left shrink-0">
                                            <p className="text-sm font-medium text-grayscale-700 whitespace-nowrap">
                                                {selectedVcs?.length}{' '}
                                                {selectedVcs?.length === 1
                                                    ? 'credential'
                                                    : 'credentials'}{' '}
                                                selected
                                            </p>
                                            {credentialQuery.length > 0 && !hasSuggested && (
                                                <p className="text-xs text-grayscale-500 mt-0.5 whitespace-nowrap">
                                                    Loading suggestions...
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <button
                                                className="flex-1 sm:flex-none sm:w-[104px] h-12 rounded-[20px] bg-white border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                                                onClick={reject}
                                            >
                                                Quit
                                            </button>
                                            <button
                                                className="flex-1 sm:flex-none sm:w-[150px] h-12 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                                onClick={() => presentModal()}
                                                disabled={selectedVcs?.length === 0 ? true : false}
                                            >
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                </footer>
                            </div>
                        )}
                        {credentialsLoading && (
                            <section className="loading-spinner-container flex items-center justify-center h-[80%] w-full mt-10">
                                <IonSpinner color="dark" />
                            </section>
                        )}
                        {!credentialsLoading && allRecords.length === 0 && (
                            <section className="flex relative flex-col achievements-list-container pt-[10px] px-[20px] text-center justify-center">
                                <strong>{m['share.noCredentialsToShare']()}</strong>
                                <button
                                    type="button"
                                    className="bg-rose-600 rounded-full text-white font-bold border px-4 py-2 w-full max-w-[200px]"
                                    onClick={reject}
                                >
                                    Cancel
                                </button>
                            </section>
                        )}
                        {!credentialsLoading && error && (
                            <p className="text-center text-rose-600 text-lg">{error}</p>
                        )}
                    </IonCol>
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export default VprQueryByExample;
