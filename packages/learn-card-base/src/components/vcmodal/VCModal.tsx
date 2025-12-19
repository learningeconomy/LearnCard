import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import {
    IonContent,
    IonRow,
    IonHeader,
    IonButton,
    IonToolbar,
    IonButtons,
    IonCol,
    IonSpinner,
    IonPage,
    IonFooter,
    useIonModal,
} from '@ionic/react';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import VCDisplayCardWrapper2 from './VCDisplayCardWrapper2';
import X from 'learn-card-base/svgs/X';

import useWallet from 'learn-card-base/hooks/useWallet';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';

import redirectStore from 'learn-card-base/stores/redirectStore';
import modalStateStore from 'learn-card-base/stores/modalStateStore';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { VC, CredentialRecord } from '@learncard/types';
import { useAcceptCredentialMutation } from 'learn-card-base/react-query/mutations/mutations';

export const LoadingVcCard: React.FC = () => {
    return (
        <section className="flippy-wrapper-container bg-red-300">
            <section className="flex overflow-hidden flex-col items-center justify-between relative max-w-[400px] h-[100%] max-h-[600px] min-h-[600px] p-7 w-full rounded-3xl shadow-3xl bg-white vc-display-card-full-container">
                <div className="w-full flex-grow h-full flex items-center justify-center bg-white">
                    <section className="loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full opacity-50 ">
                        <IonSpinner color="dark" />
                    </section>
                </div>
            </section>
        </section>
    );
};

// Just used as an example for now
export const VCClaimModalController = () => {
    const { uri } = useParams<{ uri: string }>();
    useEffect(() => {
        if (uri) {
            modalStateStore.set.presentVcModal({
                open: true,
                name: uri,
            });
        }
    }, [uri]);

    return <></>;
};

/* TODO REWRITE THIS, was originally just for normal VCs but we have added additional boost related logic,
 and it's a big mess
 need to extract from it and make pure display component */
export const VCClaim: React.FC<{
    _streamId: string;
    dismiss: ({ historyPush, callback }) => void;
    showFooter?: boolean;

    // boost claiming
    showBoostFooter?: boolean;
    handleClaimBoostCredential?: () => void;
    isLoading?: boolean;
    acceptCredentialLoading?: boolean;
    acceptCredentialCompleted?: boolean;
}> = ({
    _streamId,
    dismiss,
    showFooter = true,

    // boost claiming
    showBoostFooter = false,
    handleClaimBoostCredential = () => { },
    isLoading = false,
    acceptCredentialLoading,
    acceptCredentialCompleted,
}) => {
        const isLoggedIn = useIsLoggedIn();
        const {
            resolveCredential,
            addVCtoWallet,
            storeStreamIdInLocalStorage,
            removeStreamIdFromLocalStorage,
        } = useWallet();

        const [vc, setVC] = useState<any>();
        const [acceptVCLoading, setAcceptVCLoading] = useState(false);
        const [vcAccepted, setVCAccepted] = useState(false);
        const [uri, setUri] = useState(null);
        const [loadingVC, setIsLoadingVC] = useState(false);

        const presentVcModalState = modalStateStore.useTracked.presentVcModal();

        useEffect(() => {
            if (_streamId) {
                setUri(_streamId);
                loadVC(_streamId);
            } else {
                setUri(presentVcModalState?.name);
                loadVC(presentVcModalState?.name);
            }
        }, [presentVcModalState]);

        const loadVC = async (streamId: string) => {
            setIsLoadingVC(true);
            const vcFromCeramic = await resolveCredential(streamId);
            if (vcFromCeramic) {
                const _unwrappedVC = unwrapBoostCredential(vcFromCeramic);
                setVC(_unwrappedVC);
            }
            setIsLoadingVC(false);
            return vc;
        };

        useEffect(() => {
            loadVC(uri);
        }, [uri]);

        const handleAcceptVC = async () => {
            if (!uri) throw new Error('Invalid URI');
            setAcceptVCLoading(true);
            const vcTitle = vc?.credentialSubject?.achievement?.name;
            await addVCtoWallet({ uri, title: vcTitle, id: vcTitle });
            removeStreamIdFromLocalStorage(uri);
            setAcceptVCLoading(false);
            setVCAccepted(true);
        };

        const handleDismiss = async ({
            redirectToLogin = false,
            redirectToLoginWithStreamId = false,
        }) => {
            if (!isLoggedIn) {
                if (redirectToLogin) {
                    dismiss?.({ historyPush: '/login', callback: null });
                    return;
                }

                if (redirectToLoginWithStreamId) {
                    const dissmissArgs = {
                        historyPush: `/login?redirectTo=/claim-credential/${uri}`,
                        callback: () => redirectStore.set.authRedirect(`/claim-credential/${uri}`),
                    };
                    dismiss?.({ ...dissmissArgs });
                    return;
                }
            }

            if (isLoggedIn) {
                dismiss?.({ historyPush: null, callback: null });
            }

            if (uri && !vcAccepted) storeStreamIdInLocalStorage(uri);
        };

        let buttonText = 'Accept';

        if (isLoading || acceptCredentialLoading) {
            buttonText = 'Loading...';
        }

        if (acceptCredentialCompleted) {
            buttonText = 'Completed';
        }

        const isCertificate = vc?.display?.displayType === 'certificate';

        return (
            <IonPage>
                <IonContent
                    className="flex items-center justify-center ion-padding boost-cms-preview"
                    fullscreen
                >
                    <IonRow
                        className={`flex flex-col items-center justify-center px-6 ${isCertificate ? 'pt-14 md:pt-20' : ''
                            }`}
                    >
                        <div className="flex items-center justify-center w-full mb-2 vc-preview-modal-safe-area">
                            {!isCertificate && (
                                <button
                                    onClick={() => {
                                        handleDismiss({ redirectToLogin: true });
                                    }}
                                    className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                                >
                                    <X className="text-black w-[30px]" />
                                </button>
                            )}
                            {!vcAccepted && isLoggedIn && showBoostFooter && !showFooter && (
                                <button
                                    onClick={handleClaimBoostCredential}
                                    className="flex items-center justify-center bg-indigo-600 text-white py-2 mr-3 font-bold text-2xl tracking-wider rounded-[40px] shadow-2xl w-[200px] max-w-[320px] ml-2 uppercase font-mouse"
                                >
                                    {buttonText}
                                </button>
                            )}
                        </div>
                        {vc && (
                            <VCDisplayCardWrapper2
                                credential={vc}
                                handleClose={() => {
                                    handleDismiss({ redirectToLogin: true });
                                }}
                            />
                        )}
                        {!vc && isLoading && (
                            <section className="flippy-wrapper-container">
                                <section className="flex overflow-hidden flex-col items-center justify-between relative max-w-[400px] h-[100%] max-h-[600px] min-h-[600px] p-7 w-full rounded-3xl shadow-3xl bg-white vc-display-card-full-container">
                                    <div className="w-full flex-grow h-full flex items-center justify-center bg-white">
                                        <section className="loading-spinner-container flex flex-col items-center justify-center h-[100%] w-full opacity-50 ">
                                            <IonSpinner color="dark" />
                                        </section>
                                    </div>
                                </section>
                            </section>
                        )}
                    </IonRow>
                </IonContent>
                {showFooter && !showBoostFooter && (
                    <IonFooter translucent className="ion-no-border w-full">
                        <IonToolbar color="transparent" className="ion-no-border w-full">
                            <IonRow className="flex flex-col items-center justify-center w-full">
                                <IonCol size="12" className="flex justify-center items-center w-full">
                                    {!vcAccepted && isLoggedIn && (
                                        <>
                                            <button
                                                onClick={handleAcceptVC}
                                                className="w-[70%] flex items-center justify-center bg-grayscale-900 text-white  py-3 mr-3 font-bold text-lg rounded-[40px] shadow-2xl max-w-[320px]"
                                            >
                                                {acceptVCLoading ? 'Loading...' : 'Accept'}
                                            </button>

                                            <button
                                                onClick={() =>
                                                    handleDismiss({
                                                        redirectToLogin: false,
                                                        redirectToLoginWithStreamId: false,
                                                    })
                                                }
                                                className="w-[45px] text-grayscale-900 h-[45px] lex items-center justify-center rounded-full border-solid border-grayscale-900 border-2 p-2 mr-3 bg-white shadow-2xl"
                                            >
                                                X
                                            </button>
                                        </>
                                    )}
                                    {vcAccepted && isLoggedIn && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleDismiss({
                                                        redirectToLogin: false,
                                                        redirectToLoginWithStreamId: false,
                                                    })
                                                }
                                                className="w-[70%] flex items-center justify-center bg-grayscale-900 text-white  py-3 mr-3 font-bold text-lg rounded-[40px] shadow-2xl max-w-[320px]"
                                            >
                                                Accepted
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDismiss({
                                                        redirectToLogin: false,
                                                        redirectToLoginWithStreamId: false,
                                                    })
                                                }
                                                className="w-[45px] h-[45px] lex items-center justify-center rounded-full border-solid border-grayscale-900 border-2 p-2 mr-3 bg-white shadow-2xl text-black"
                                            >
                                                X
                                            </button>
                                        </>
                                    )}

                                    {!isLoggedIn && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    handleDismiss({
                                                        redirectToLoginWithStreamId: true,
                                                    });
                                                }}
                                                className="w-[70%] flex items-center justify-center bg-grayscale-900 text-white  py-3 mr-3 font-bold text-lg rounded-[40px] shadow-2xl max-w-[320px]"
                                            >
                                                Login To Accept
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleDismiss({ redirectToLogin: true });
                                                }}
                                                className="w-[45px] h-[45px] lex items-center justify-center rounded-full border-solid border-grayscale-900 border-2 p-2 mr-3 bg-white shadow-2xl text-black"
                                            >
                                                X
                                            </button>
                                        </>
                                    )}
                                </IonCol>
                            </IonRow>
                        </IonToolbar>
                    </IonFooter>
                )}
            </IonPage>
        );
    };

export const VCModal = ({
    onDismiss,
    credentialTitle,
    cr,
    overrideIssueeName,
    vc,
}: {
    credentialTitle?: string;
    vc?: VC;
    cr?: CredentialRecord;
    overrideIssueeName?: string;
    onDismiss: (data?: string | null | undefined | number, role?: string) => void;
}) => {
    const [credential, setCredential] = useState<VC>();
    const { getVCFromWallet } = useWallet();

    const loadVC = async () => {
        if (!vc && credentialTitle) {
            const vcFromWallet = await getVCFromWallet(credentialTitle);
            setCredential(vcFromWallet);
        }

        if (!vc && cr?.id) {
            const vcFromWallet = await getVCFromWallet(cr?.id);
            setCredential(vcFromWallet);
        }

        if (vc) {
            setCredential(vc);
        }
        return;
    };

    useEffect(() => {
        loadVC();
    }, []);

    const handleDismiss = async () => {
        onDismiss?.();
    };

    const isCertificate = vc?.display?.displayType === 'certificate';

    return (
        <IonPage>
            <IonContent
                className="flex items-center justify-center ion-padding boost-cms-preview"
                fullscreen
            >
                <IonRow
                    className={`flex flex-col items-center justify-center px-6 ${isCertificate ? 'pt-14 md:pt-20' : ''
                        }`}
                >
                    {!isCertificate && (
                        <div className="flex items-center justify-center mb-2 vc-preview-modal-safe-area">
                            <button
                                onClick={() => handleDismiss()}
                                className="w-[50px] h-[50px] bg-white rounded-full flex items-center justify-center shadow-3xl"
                            >
                                <X className="text-black w-[30px]" />
                            </button>
                        </div>
                    )}
                    <section className="vc-flippy-display-container flex h-full w-full justify-center items-center">
                        {!credential && <LoadingVcCard />}
                        {credential && (
                            <VCDisplayCardWrapper2
                                cr={cr}
                                overrideIssueName={overrideIssueeName}
                                credential={credential}
                                handleClose={() => handleDismiss()}
                            />
                        )}
                    </section>
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export default VCModal;
