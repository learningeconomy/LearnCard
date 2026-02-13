import React, { useState, useCallback, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

import { IonSpinner, useIonAlert, IonPage } from '@ionic/react';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import Lottie from 'react-lottie-player';
const HourGlass = '/lotties/hourglass.json';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import BoostDetailsSideMenu from '../boostCMS/BoostPreview/BoostDetailsSideMenu';
import BoostDetailsSideBar from '../boostCMS/BoostPreview/BoostDetailsSideBar';
import useFirebaseAnalytics from 'apps/learn-card-app/src/hooks/useFirebaseAnalytics';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { useGetResolvedCredential, useToast, ToastTypeEnum } from 'learn-card-base';

import {
    CredentialCategoryEnum,
    useAcceptCredentialMutation,
    useModal,
    useWallet,
    ModalTypes,
    useDeviceTypeByWidth,
} from 'learn-card-base';
import { LCNNotification, VC, VP, VerificationItem } from '@learncard/types';
import {
    isEndorsementCredential,
    getAchievementType,
    getDefaultCategoryForCredential,
    parseShareLinkParams,
} from 'learn-card-base/helpers/credentialHelpers';
import ViewEndorsementRequest from '../../boost-endorsements/EndorsementRequestForm/ViewEndorsementRequest';

type BoostClaimCardProps = {
    credential: VC | VP;
    showFooter?: boolean;
    credentialUri?: string;
    showBoostFooter?: boolean;
    handleClaimBoostCredential?: () => boolean;
    isLoading?: boolean;
    acceptCredentialLoading?: boolean;
    acceptCredentialCompleted?: boolean;
    successCallback?: () => void;
    onDismiss?: () => void;
    notification?: LCNNotification;
    hideEndorsementRequestCard?: boolean;
};

export const BoostClaimCard: React.FC<BoostClaimCardProps> = ({
    credential: _credential,
    showFooter = true,
    showBoostFooter = false,
    isLoading = false,
    acceptCredentialCompleted,
    credentialUri,
    successCallback,
    onDismiss,
    notification,
    hideEndorsementRequestCard,
}) => {
    const history = useHistory();
    const isLoggedIn = useIsLoggedIn();
    const { newModal, closeModal } = useModal();
    const { initWallet } = useWallet();
    const { isMobile } = useDeviceTypeByWidth();
    const [credential, setCredential] = useState(_credential);
    const [vcVerifications, setVCVerifications] = useState<VerificationItem[]>([]);
    const { data: resolvedCredential } = useGetResolvedCredential(credentialUri, !credential);

    const { seed, pin, uri } = parseShareLinkParams(notification?.data?.metadata?.sharedUri);
    const sharedUri = notification?.data?.metadata?.sharedUri;
    const relationship = notification?.data?.metadata?.relationship;
    const credentialId = notification?.data?.metadata?.credentialId;

    useEffect(() => {
        if (resolvedCredential) {
            setCredential(resolvedCredential);
        }
    }, [resolvedCredential]);

    useEffect(() => {
        const verify = async () => {
            const wallet = await initWallet();
            const verifications = await wallet?.invoke?.verifyCredential(credential, {}, true);
            setVCVerifications(verifications);
        };

        verify();
    }, [credential]);

    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const [isFront, setIsFront] = useState(true);
    const [isClaimLoading, setIsClaimLoading] = useState(false);
    const [isClaimed, setIsClaimed] = useState(acceptCredentialCompleted);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const {
        mutate,
        isPending: acceptCredentialLoading,
        isSuccess: acceptCredentialSuccess,
    } = useAcceptCredentialMutation();
    const { addVCtoWallet } = useWallet();

    const [presentAlert, dismissAlert] = useIonAlert();
    const { presentToast } = useToast();

    const category = getDefaultCategoryForCredential(credential);
    const achievementType = getAchievementType(credential);

    const _isEndorsement = isEndorsementCredential(credential) ?? false;

    const handleBoostCredential = async (visibility?: boolean) => {
        const wallet = await initWallet();

        if (!acceptCredentialLoading && !isClaimLoading && !isClaimed) {
            setIsClaimLoading(true);
            try {
                mutate(
                    { uri: credentialUri, metadata: notification?.data?.metadata },
                    {
                        async onSuccess(data, variables, context) {
                            if (_isEndorsement) {
                                await wallet.invoke.storeEndorsement(credential, {
                                    credentialId,
                                    relationship,
                                    sharedUri,
                                    visibility: visibility ? 'public' : 'private',
                                });
                            } else {
                                await addVCtoWallet({ uri: credentialUri });
                            }

                            if (credential) {
                                logAnalyticsEvent('claim_boost', {
                                    category: category,
                                    boostType: achievementType,
                                    method: 'Notification',
                                });
                            }

                            setIsClaimed(true);
                            presentToast(`Successfully claimed Credential!`, {
                                duration: 3000,
                                type: ToastTypeEnum.Success,
                            });

                            setIsClaimLoading(false);
                            await successCallback?.();

                            if (category === CredentialCategoryEnum.family) {
                                history.replace(
                                    `/families?boostUri=${credentialUri}&showPreview=true`
                                );
                            }

                            closeModal();
                        },
                    }
                );
            } catch (err) {
                console.log('acceptCredential::error', err?.message);
                presentAlert({
                    backdropDismiss: false,
                    cssClass: 'boost-confirmation-alert',
                    header: `There was an error: ${err?.message}`,
                    buttons: [
                        {
                            text: 'Okay',
                            role: 'cancel',
                            handler: () => {
                                dismissAlert();
                            },
                        },
                    ],
                });
                setIsClaimLoading(false);
            }
        }
    };

    const handleImageClick = useCallback((url: string) => {
        setSelectedImage(url);
    }, []);

    const isID = credential?.display?.displayType === 'id' || false;
    const isFamily = category === CredentialCategoryEnum.family;

    let claimStatusText;
    const disableClaimButton = acceptCredentialLoading || isClaimLoading || isClaimed;

    if (!isClaimLoading && isLoggedIn && credential && isClaimed) {
        claimStatusText = 'Claimed';
        if (isFamily) claimStatusText = 'Joined';
    }
    if (isClaimLoading && isLoggedIn) {
        claimStatusText = 'Saving...';
        if (isFamily) claimStatusText = 'Joining...';
    }

    if (!isClaimLoading && isLoggedIn && credential && !isClaimed) {
        claimStatusText = 'Accept';
        if (isFamily) claimStatusText = 'Join';
    }

    useEffect(() => {
        if (!isFront) {
            setIsFront(!isFront);
            if (isMobile) {
                openDetailsSideModal();
            }
        }
    }, [isFront]);

    const openDetailsSideModal = () => {
        if (vcVerifications.length === 0) {
            return;
        }
        newModal(
            <BoostDetailsSideMenu
                credential={credential}
                // categoryType={categoryType}
                verificationItems={vcVerifications}
                hideEndorsementRequestCard={hideEndorsementRequestCard}
            />,
            {
                className: '!bg-transparent',
                hideButton: true,
            },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    if (_isEndorsement) {
        return (
            <ViewEndorsementRequest
                sharedLink={{ seed, pin, uri }}
                notification={notification}
                endorsementVC={credential}
                handleSaveEndorsement={handleBoostCredential}
                isClaimed={isClaimed}
            />
        );
    }

    return (
        <IonPage className="flex items-center justify-center boost-cms-preview">
            <div className="flex h-full w-full">
                {isClaimLoading && (
                    <div className="absolute w-full h-full top-0 left-0 z-[10001] flex items-center justify-center flex-col boost-loading-wrapper">
                        <div className="w-[180px] h-full m-auto mt-[5px] flex items-center justify-center">
                            <Lottie
                                loop
                                path={HourGlass}
                                play
                                style={{ width: '180px', height: '180px' }}
                            />
                        </div>
                    </div>
                )}
                <section className="flex flex-1 h-full overflow-y-auto items-start justify-center relative boost-cms-preview [&::part(scroll)]:px-0">
                    <section className="flex flex-col items-center justify-center px-2 w-full">
                        <section
                            className={`boost-preview-display px-6 w-full safe-area-top-margin max-h-full pb-32 disable-scrollbars ${
                                Capacitor.isNativePlatform() ? 'pt-0' : 'pt-[30px]'
                            }`}
                        >
                            {credential && !selectedImage && (
                                <VCDisplayCardWrapper2
                                    credential={credential}
                                    hideNavButtons
                                    // isFrontOverride={isFront}
                                    setIsFrontOverride={setIsFront}
                                    onMediaClick={handleImageClick}
                                    bottomButton={
                                        isID ? (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    handleBoostCredential();
                                                }}
                                                className="bg-teal-400 rounded-[30px] w-full p-[7px] font-poppins text-white text-[17px] font-[600] leading-[24px] tracking-[0.25px] mt-[10px] disabled:opacity-60"
                                                disabled={disableClaimButton}
                                            >
                                                {claimStatusText}
                                            </button>
                                        ) : undefined
                                    }
                                    hideFrontFaceDetails={false}
                                    claimStatusText={claimStatusText}
                                    handleClaim={handleBoostCredential}
                                />
                            )}
                            {selectedImage && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="relative max-w-full max-h-[80vh]">
                                        <img
                                            src={selectedImage}
                                            alt="Full size attachment"
                                            className="max-w-full max-h-[80vh] object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                            {!credential && isLoading && (
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
                        </section>
                    </section>
                </section>
                <footer className="w-full flex justify-center items-center ion-no-border absolute bottom-0 z-10">
                    <BoostFooter
                        handleClose={() => {
                            onDismiss?.();
                            closeModal();
                        }}
                        handleDetails={isMobile ? () => openDetailsSideModal() : undefined}
                        // handleBack={!isFront ? () => setIsFront(!isFront) : undefined}
                        handleClaim={handleBoostCredential}
                        claimBtnText={claimStatusText}
                        disableClaimButton={disableClaimButton}
                        isIdClaim={isID}
                        useFullCloseButton={!isMobile}
                    />
                </footer>
                {!isMobile && (
                    <BoostDetailsSideBar
                        credential={
                            credential?.type.includes('ClrCredential')
                                ? credential?.credentialSubject?.verifiableCredential[0]
                                : credential
                        }
                        // categoryType={categoryType}
                        verificationItems={vcVerifications}
                        hideEndorsementRequestCard={hideEndorsementRequestCard}
                    />
                )}
            </div>
        </IonPage>
    );
};

export default BoostClaimCard;
