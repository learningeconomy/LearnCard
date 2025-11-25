import React, { useState, useEffect, useRef } from 'react';
import BoostEarnedCard from 'apps/learn-card-app/src/components/boost/boost-earned-card/BoostEarnedCard';
import { TYPE_TO_IMG_SRC } from '@learncard/react';
import VCToShare from '../VCToShare';
import './VprQueryByExample.scss';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';

import { CurrentUser, useGetCredentialList, useGetResolvedCredentials } from 'learn-card-base';

import { CATEGORY_TO_WALLET_SUBTYPE } from 'learn-card-base/helpers/credentialHelpers';
import { getUniqueId } from 'learn-card-base/helpers/credentials/ids';
import Lottie from 'react-lottie-player';
import HourGlass from '../../../assets/lotties/hourglass.json';

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

        const categoryImgUrl = TYPE_TO_IMG_SRC[CATEGORY_TO_WALLET_SUBTYPE[credential.category]];
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
            console.error(e);
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
                    <IonCol className="text-center p-0 h-full">
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
                                ? 'Loading verifiable credentials...'
                                : 'Select the verifiable credentials you would like to share.'}
                        </h2>
                        {credentialsLoading && (
                            <div className="relative w-full text-center flex flex-col items-center justify-center">
                                <div className="max-w-[500px]">
                                    <Lottie
                                        loop
                                        animationData={HourGlass}
                                        play
                                        style={{ width: '100%', height: '100%' }}
                                    />
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
                                    <IonRow className="p-0 flex flex-row items-center flex-wrap w-full mobile:mb-60 xl:mb-64 achievements-list-container">
                                        {renderCredentialList}
                                        <div role="presentation" ref={infiniteScrollRef} />
                                    </IonRow>
                                </IonGrid>
                                <footer className="fixed mobile:bottom-0 mobile:w-full lg:bottom-5 lg:right-10 lg:w-[500px] z-9999 bg-white border-t border-grayscale-200 mobile:p-2.5 lg:p-5 lg:rounded-[20px] mobile:shadow-footer lg:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.10)]">
                                    <h1 className="text-left text-base text-grayscale-900 font-bold font-poppins mobile:pt-[5px] mobile:pl-[20px]">
                                        {selectedVcs?.length > 1
                                            ? selectedVcs?.length + ' Credentials'
                                            : selectedVcs?.length + ' Credential'}{' '}
                                        Selected
                                    </h1>
                                    {credentialQuery.length === 0 || hasSuggested ? (
                                        <></>
                                    ) : (
                                        <span>Loading credential suggestions...</span>
                                    )}
                                    <section className="flex items-center justify-evenly flex-wrap mt-5">
                                        <button
                                            className={
                                                selectedVcs?.length === 0
                                                    ? 'bg-indigo-700 opacity-50 rounded-[40px] text-white font-poppins h-12 mobile:w-[300px] lg:w-[200px] text-xl m-1.5 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)]'
                                                    : 'bg-indigo-700 rounded-[40px] text-white font-poppins h-12 mobile:w-[300px] lg:w-[200px] text-xl m-1.5 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)]'
                                            }
                                            onClick={() => presentModal()}
                                            disabled={selectedVcs?.length === 0 ? true : false}
                                        >
                                            REVIEW
                                        </button>
                                        <button
                                            className="bg-grayscale-700 rounded-[40px] text-white font-poppins h-12 mobile:w-[300px] lg:w-[200px] text-xl m-1.5 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.25)]"
                                            onClick={reject}
                                        >
                                            QUIT
                                        </button>
                                    </section>
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
                                <strong>No credentials to share.</strong>
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
