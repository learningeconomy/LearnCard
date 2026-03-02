import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import moment from 'moment';

import { IonPage, IonSpinner, useIonModal, useIonAlert, IonRow } from '@ionic/react';
// import MainHeader from '../../components/main-header/MainHeader';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import ClaimBoostLoggedOutPrompt from 'learn-card-base/components/boost/claimBoostLoggedOutPrompt/ClaimBoostLoggedOutPrompt';
import ClaimBoostLoading from './ClaimBoostLoading';
import BoostDetailsSideMenu from '../../components/boost/boostCMS/BoostPreview/BoostDetailsSideMenu';
import BoostDetailsSideBar from '../../components/boost/boostCMS/BoostPreview/BoostDetailsSideBar';
import CredentialVerificationDisplay, {
    getInfoFromCredential,
} from 'learn-card-base/components/CredentialBadge/CredentialVerificationDisplay';

import {
    useWallet,
    usePathQuery,
    useIsLoggedIn,
    redirectStore,
    ProfilePicture,
    LEARNCARD_NETWORK_API_URL,
    CredentialCategoryEnum,
    useGetCredentialWithEdits,
    useGetVCInfo,
    useDeviceTypeByWidth,
    useModal,
    ModalTypes,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { useAnalytics, AnalyticsEvents } from '@analytics';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import useLCNGatedAction from '../../components/network-prompts/hooks/useLCNGatedAction';
import { useUploadVcFromText } from '../../hooks/useUploadVcFromText';

import { getEmojiFromDidString } from 'learn-card-base/helpers/walletHelpers';
import { getUserHandleFromDid } from 'learn-card-base/helpers/walletHelpers';
import { VC, VerificationItem } from '@learncard/types';

import {
    getAchievementType,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';

const ClaimBoostBodyPreviewOverride: React.FC<{
    boostVC: VC;
    vc?: VC;
}> = ({ boostVC, vc }) => {
    const isLoggedIn = useIsLoggedIn();
    const currentUser = useCurrentUser();

    const { issuerName, issuerProfileImageElement } = useGetVCInfo(vc || boostVC || {});

    let issueDate = moment(boostVC?.issuanceDate).format('MMM DD, YYYY');
    if (vc) {
        issueDate = moment(vc?.issuanceDate).format('MMM DD, YYYY');
    }

    if (isLoggedIn) {
        return (
            <>
                <h3 className="text-[25px] leading-[130%] text-grayscale-900 capitalize">
                    {currentUser?.name}
                </h3>
                <div className="relative">
                    <div className="vc-issuee-image h-[60px] w-[60px] rounded-full overflow-hidden">
                        <ProfilePicture
                            customImageClass="w-full h-full object-cover"
                            customContainerClass="flex items-center justify-center h-full text-white font-medium text-4xl"
                            customSize={500}
                        />
                    </div>
                    <div className="vc-issuer-image h-[30px] w-[30px] rounded-full overflow-hidden absolute bottom-[-12px] right-[-12px]">
                        {issuerProfileImageElement ? (
                            issuerProfileImageElement
                        ) : (
                            <div className="flex flex-row items-center justify-center h-full w-full overflow-hidden bg-gray-50 text-emerald-700 font-semibold text-xl">
                                {getEmojiFromDidString(issuerName)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="vc-issue-details mt-[10px] flex flex-col gap-[13px] items-center font-montserrat text-[14px] leading-[20px]">
                    <div className="vc-issue-details mt-[10px] flex flex-col justify-center items-center text-center font-montserrat text-[14px] leading-[20px]">
                        <span className="created-at text-grayscale-700">{issueDate}</span>
                        <span className="issued-by text-grayscale-900 font-[500]">
                            by <strong className="font-[700] capitalize">{issuerName}</strong>
                        </span>
                    </div>
                    <CredentialVerificationDisplay credential={boostVC} showText />
                </div>
            </>
        );
    }

    return (
        <>
            <div className="relative">
                <div className="vc-issuee-image h-[60px] w-[60px] rounded-full overflow-hidden">
                    {issuerProfileImageElement}
                </div>
            </div>
            <div className="vc-issue-details mt-[10px] flex flex-col justify-center items-center text-center font-montserrat text-[14px] leading-[20px]">
                <span className="created-at text-grayscale-700">{issueDate}</span>
                <span className="issued-by text-grayscale-900 font-[500]">
                    by <strong className="font-[700] capitalize">{issuerName}</strong>
                </span>
            </div>
        </>
    );
};

const ClaimBoost: React.FC<{
    uri?: string;
    claimChallenge?: string;
    dismissClaimModal?: () => void;
    vc?: VC | null;
}> = ({ uri, claimChallenge, dismissClaimModal = () => {}, vc }) => {
    const history = useHistory();
    const query = usePathQuery();
    const isLoggedIn = useIsLoggedIn();
    const { initWallet, addVCtoWallet } = useWallet();
    const [presentAlert, dismissAlert] = useIonAlert();
    const { track } = useAnalytics();
    const { newModal, closeModal } = useModal();
    const { isMobile } = useDeviceTypeByWidth();

    const { uploadVcFromTextAndAddToWallet } = useUploadVcFromText();
    const { gate } = useLCNGatedAction();

    const boostUri = (query.get('boostUri') || uri)?.replace('localhost:', 'localhost%3A');
    const challenge = query.get('challenge') || claimChallenge;

    const [loading, setLoading] = useState<boolean>(false);
    const [isClaimLoading, setIsClaimLoading] = useState<boolean>(false);
    const [isClaimed, setIsClaimed] = useState<boolean>(false);
    const [boost, setBoost] = useState<VC | null>(null);
    const [isFront, setIsFront] = useState(true);
    const [vcVerifications, setVCVerifications] = useState<VerificationItem[]>([]);
    const { presentToast } = useToast();

    const { credentialWithEdits } = useGetCredentialWithEdits(boost, boostUri);

    const handleRedirectTo = () => {
        const redirectTo = `/claim/boost?boostUri=${boostUri}&challenge=${challenge}`;
        redirectStore.set.lcnRedirect(redirectTo);
        dismissClaimModal?.();
        dismissModal();
        handleCancel();
    };

    const [presentModal, dismissModal] = useIonModal(ClaimBoostLoggedOutPrompt, {
        handleCloseModal: () => dismissModal(),
        handleRedirectTo: handleRedirectTo,
    });

    const [showLoader, dismissLoader] = useIonModal(ClaimBoostLoading);

    const verify = async (credential: VC) => {
        const wallet = await initWallet();
        const verifications = await wallet?.invoke?.verifyCredential(credential, {}, true);

        setVCVerifications(verifications);
    };

    const getBoost = async () => {
        if (!boostUri) return;
        try {
            setLoading(true);

            const result = await fetch(
                `${LEARNCARD_NETWORK_API_URL}/storage/resolve?uri=${boostUri}`
            );

            if (result.status !== 200) throw new Error('Error resolving boost');

            const boostVC: VC = await result.json();

            setBoost(boostVC);
            verify(boostVC);
        } catch (error: any) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        dismissClaimModal?.();
        history?.push('/');
    };

    const handleClaimBoost = async () => {
        if (isClaimed) return;
        const wallet = await initWallet();

        const { prompted } = await gate();
        if (prompted) return;

        try {
            setIsClaimLoading(true);

            const claimedBoostUri = await wallet?.invoke?.claimBoostWithLink(boostUri, challenge);
            await addVCtoWallet({ uri: claimedBoostUri });

            const category = getDefaultCategoryForCredential(boost);
            const achievementType = getAchievementType(boost);

            if (boost) {
                track(AnalyticsEvents.CLAIM_BOOST, {
                    boostType: category,
                    achievementType,
                    method: 'Claim Modal',
                });
            }

            setIsClaimed(true);
            setIsClaimLoading(false);
            dismissClaimModal?.();

            if (category === CredentialCategoryEnum.family) {
                history.replace(`/families?boostUri=${claimedBoostUri}&showPreview=true`);
            } else {
                history?.push('/');
            }

            presentToast(`Successfully claimed Credential!`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (e) {
            setIsClaimLoading(false);

            presentToast(`Unable to claim Credential`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });

            presentAlert({
                backdropDismiss: false,
                cssClass: 'boost-confirmation-alert',
                header: `The boost claim link has expired or has reached the maximum number of times it can be claimed.`,
                buttons: [
                    {
                        text: 'Okay',
                        role: 'cancel',
                        handler: () => {
                            dismissAlert();
                            handleCancel();
                        },
                    },
                ],
            });

            console.warn('claimBoostWithLink::error', e);
        }
    };

    const handleClaimRawCredential = async () => {
        if (isClaimed || !vc) return;

        const { prompted } = await gate();
        if (prompted) return;

        try {
            setIsClaimLoading(true);
            await uploadVcFromTextAndAddToWallet(vc);

            setIsClaimed(true);
            setIsClaimLoading(false);
            dismissClaimModal?.();

            history?.push('/');

            presentToast(`Successfully claimed Credential!`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (e) {
            setIsClaimLoading(false);

            presentToast(`Unable to claim Credential`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    useEffect(() => {
        getBoost();
    }, []);

    const _boost = credentialWithEdits ?? boost;

    const handleClaimBoostAction = async () => {
        if (isLoggedIn && !loading) {
            handleClaimBoost();
        }
        if (!isLoggedIn && !loading) {
            presentModal({
                cssClass: 'center-modal boost-logged-out-confirmation-prompt',
                backdropDismiss: true,
                showBackdrop: false,
            });
        }
    };

    const credentialBodyOverride = <ClaimBoostBodyPreviewOverride boostVC={_boost} vc={vc} />;

    let category = null;
    if (boost) category = getDefaultCategoryForCredential(boost);

    const isFamily = category === CredentialCategoryEnum.family;

    let actionButtonText = 'Accept';

    if (isClaimLoading) {
        actionButtonText = 'Loading...';
        if (isFamily) actionButtonText = 'Joining...';
    } else if (!isClaimLoading && isClaimed) {
        actionButtonText = 'Accepted';
        if (isFamily) actionButtonText = 'Joined';
    } else {
        actionButtonText = 'Accept';
        if (isFamily) actionButtonText = 'Join';
    }

    const appearance = boost?.display;
    const wallpaperImage = appearance?.backgroundImage;
    const wallpaperBackgroundColor = appearance?.backgroundColor;
    const isWallpaperFaded = appearance?.fadeBackgroundImage;
    const isWallpaperTiled = appearance?.repeatBackgroundImage;

    let backgroundStyles = {
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundImage: `url(${wallpaperImage})`,
        backgroundRepeat: 'no-repeat',
    };

    if (isWallpaperFaded) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundImage: `linear-gradient(#353E6480, #353E6480), url(${wallpaperImage})`,
        };

        if (wallpaperBackgroundColor) {
            backgroundStyles = {
                ...backgroundStyles,
                backgroundImage: `linear-gradient(${wallpaperBackgroundColor}80, ${wallpaperBackgroundColor}80), url(${wallpaperImage})`,
            };
        }
    }

    if (isWallpaperTiled) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
        };
    }

    if (!isWallpaperFaded) {
        backgroundStyles.backgroundColor = wallpaperBackgroundColor;
    }

    const openDetailsSideModal = () => {
        newModal(
            <BoostDetailsSideMenu
                credential={{ ..._boost, boostId: boostUri }}
                categoryType={category}
                verificationItems={vcVerifications}
            />,
            {
                className: '!bg-transparent',
                hideButton: true,
            },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    return (
        <IonPage>
            {/* <MainHeader
                showBackButton={false}
                customClassName="bg-white"
                customHeaderClass="main-header-branding-public-route"
            /> */}
            <div className="flex h-full bg-grayscale-100">
                <section
                    style={{
                        ...backgroundStyles,
                    }}
                    className="flex h-full overflow-y-scroll flex-1 items-start justify-center relative boost-cms-preview [&::part(scroll)]:px-0"
                >
                    {/* <div
                        style={{
                            ...backgroundStyles,
                        }}
                        className="flex flex-col items-center justify-center px-2 overflow-x-auto h-full pt-[30px]"
                    > */}
                    <section
                        className={`px-6 w-full safe-area-top-margin overflow-y-auto max-h-full pb-32 disable-scrollbars ${
                            Capacitor.isNativePlatform() ? 'pt-0' : 'pt-[30px]'
                        }`}
                    >
                        <div className="pb-4 vc-preview-modal-safe-area h-full w-full">
                            {loading && (
                                <section className="relative loading-spinner-container flex flex-col items-center justify-center h-full w-full">
                                    <IonSpinner color="black" />
                                    <p className="mt-2 font-bold text-lg">Loading...</p>
                                </section>
                            )}
                            {!loading && !boost && !vc && (
                                <section className="h-full flex flex-col pt-[10px] px-[20px] text-center justify-center">
                                    <h1 className="text-center text-xl font-bold text-grayscale-800">
                                        Eeek!
                                    </h1>
                                    <strong className="text-center font-medium text-grayscale-600">
                                        Unable to find Credential
                                    </strong>
                                </section>
                            )}

                            {boost && !loading && !vc && (
                                <div>
                                    <VCDisplayCardWrapper2
                                        useCurrentUserName
                                        credential={{ ..._boost, boostId: boostUri }}
                                        customBodyCardComponent={credentialBodyOverride}
                                        customFooterComponent={<div />}
                                        checkProof={false}
                                        // isFrontOverride={isFront}
                                        setIsFrontOverride={setIsFront}
                                        hideNavButtons
                                        hideFrontFaceDetails={false}
                                        claimStatusText={actionButtonText}
                                        handleClaim={handleClaimBoost}
                                    />
                                </div>
                            )}

                            {vc && !loading && (
                                <>
                                    <VCDisplayCardWrapper2
                                        useCurrentUserName
                                        credential={vc}
                                        customBodyCardComponent={credentialBodyOverride}
                                        customFooterComponent={<div />}
                                        checkProof={false}
                                        // isFrontOverride={isFront}
                                        setIsFrontOverride={setIsFront}
                                        hideNavButtons
                                        hideFrontFaceDetails={false}
                                        claimStatusText={actionButtonText}
                                        handleClaim={handleClaimBoost}
                                    />
                                </>
                            )}
                        </div>
                    </section>
                    {/* </div> */}
                </section>

                <footer className="w-full flex justify-center items-center ion-no-border absolute bottom-0 z-10">
                    <BoostFooter
                        handleClose={handleCancel}
                        handleDetails={isMobile ? () => openDetailsSideModal() : undefined}
                        handleClaim={vc ? handleClaimRawCredential : handleClaimBoostAction}
                        claimBtnText={actionButtonText}
                        useFullCloseButton={!isMobile}
                    />
                </footer>
                {!isMobile && (
                    <BoostDetailsSideBar
                        verificationItems={vcVerifications}
                        credential={boost}
                        categoryType={category}
                    />
                )}
            </div>
        </IonPage>
    );
};

export default ClaimBoost;
