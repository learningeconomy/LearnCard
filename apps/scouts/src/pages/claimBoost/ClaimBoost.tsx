import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { useHistory } from 'react-router';

import { IonContent, IonPage, IonSpinner, useIonAlert, IonRow } from '@ionic/react';
// import MainHeader from '../../components/main-header/MainHeader';
import X from 'learn-card-base/svgs/X';
// @ts-ignore
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import ViewTroopIdModal from '../troop/ViewTroopIdModal';
import ClaimBoostLoading from './ClaimBoostLoading';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';
import ClaimBoostLoggedOutPrompt from '../../components/boost/logged-out-claim-boost/ClaimBoostLoggedOutPrompt';

import useFirebaseAnalytics from '../../hooks/useFirebaseAnalytics';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { useCheckIfUserInNetwork } from '../../components/network-prompts/hooks/useCheckIfUserInNetwork';
import { useAddCredentialToWallet } from '../../components/boost/mutations';
import {
    useModal,
    useWallet,
    usePathQuery,
    useIsLoggedIn,
    useGetProfile,
    redirectStore,
    UserProfilePicture,
    ProfilePicture,
    BrandingEnum,
    ModalTypes,
    SCOUTPASS_NETWORK_API_URL,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { getUserHandleFromDid } from 'learn-card-base/helpers/walletHelpers';
import { isTroopCredential, getRoleFromCred, getScoutsNounForRole } from '../../helpers/troop.helpers';

import { VC } from '@learncard/types';
import {
    getAchievementType,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { useHighlightedCredentials } from '../../hooks/useHighlightedCredentials';

const ClaimBoostBodyPreviewOverride: React.FC<{ boostVC: VC }> = ({ boostVC }) => {
    const isLoggedIn = useIsLoggedIn();
    const currentUser = useCurrentUser();

    const profileId = getUserHandleFromDid(boostVC?.issuer as any);
    const { data } = useGetProfile(profileId);

    const issueDate = moment(boostVC?.issuanceDate).format('MMM DD, YYYY');

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
                        <UserProfilePicture
                            user={data}
                            customImageClass="w-full h-full object-cover"
                            customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
                            customSize={500}
                        />
                    </div>
                </div>
                <div className="vc-issue-details mt-[10px] flex flex-col items-center font-montserrat text-[14px] leading-[20px]">
                    <span className="created-at text-grayscale-700">{issueDate}</span>
                    <span className="issued-by text-grayscale-900 font-[500]">
                        by <strong className="font-[700] capitalize">{data?.displayName}</strong>
                    </span>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="relative">
                <div className="vc-issuee-image h-[60px] w-[60px] rounded-full overflow-hidden">
                    <UserProfilePicture
                        user={data}
                        customImageClass="w-full h-full object-cover"
                        customContainerClass="flex items-center justify-center h-full text-white font-medium text-4xl"
                        customSize={500}
                    />
                </div>
            </div>
            <div className="vc-issue-details mt-[10px] flex flex-col items-center font-montserrat text-[14px] leading-[20px]">
                <span className="created-at text-grayscale-700">{issueDate}</span>
                <span className="issued-by text-grayscale-900 font-[500]">
                    by <strong className="font-[700] capitalize">{data?.displayName}</strong>
                </span>
            </div>
        </>
    );
};

export const ClaimBoostModal: React.FC<{
    uri?: string;
    claimChallenge?: string;
    dismissClaimModal?: () => void;
}> = ({ uri, claimChallenge, dismissClaimModal = () => {} }) => {
    const history = useHistory();
    const query = usePathQuery();
    const isLoggedIn = useIsLoggedIn();
    const { initWallet } = useWallet();
    const [presentAlert, dismissAlert] = useIonAlert();
    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const checkIfUserInNetwork = useCheckIfUserInNetwork();
    const { mutateAsync: addCredentialToWallet } = useAddCredentialToWallet();
    const boostUri = query.get('boostUri') || uri;
    const challenge = query.get('challenge') || claimChallenge;
    const [loading, setLoading] = useState<boolean>(false);
    const [isClaimLoading, setIsClaimLoading] = useState<boolean>(false);
    const [isClaimed, setIsClaimed] = useState<boolean>(false);
    const [boost, setBoost] = useState<VC | null>(null);
    const [isFront, setIsFront] = useState(true);
    const { presentToast } = useToast();
    const troopTypes = ['ext:TroopID', 'ext:GlobalID', 'ext:NetworkID', 'ext:ScoutID'];

    // Get issuer DID and profile ID for unknownVerifierTitle
    const issuerDid = typeof boost?.issuer === 'string' ? boost.issuer : boost?.issuer?.id;
    const profileID = issuerDid?.split(':').pop();
    const { credentials: highlightedCreds } = useHighlightedCredentials(profileID);

    const unknownVerifierTitle = React.useMemo(() => {
        if (!highlightedCreds || highlightedCreds.length === 0) return undefined;

        const role = getRoleFromCred(highlightedCreds[0]);
        return getScoutsNounForRole(role); // Just the role, no "Verified" prefix
    }, [highlightedCreds]);

    const handleRedirectTo = () => {
        const redirectTo = `/claim/boost?boostUri=${boostUri}&challenge=${challenge}`;
        redirectStore.set.lcnRedirect(redirectTo);
        dismissClaimModal?.();
        closeLoggedOutModal();
        handleCancel();
    };

    const { newModal: newLoggedOutModal, closeModal: closeLoggedOutModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const { newModal: newLoaderModal, closeModal: closeLoaderModal } = useModal({
        mobile: ModalTypes.Cancel,
        desktop: ModalTypes.Cancel,
    });

    const openLoggedOutModal = () => {
        newLoggedOutModal(
            <ClaimBoostLoggedOutPrompt
                handleCloseModal={closeLoggedOutModal}
                handleRedirectTo={handleRedirectTo}
            />
        );
    };

    const openLoaderModal = () => {
        newLoaderModal(<ClaimBoostLoading />);
    };

    const getBoost = async () => {
        try {
            setLoading(true);

            const result = await fetch(
                `${SCOUTPASS_NETWORK_API_URL}/storage/resolve?uri=${boostUri}`
            );

            if (result.status !== 200) throw new Error('Error resolving boost');

            const boostVC: VC = await result.json();

            setBoost(boostVC);
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

        if (!checkIfUserInNetwork()) return;

        try {
            setIsClaimLoading(true);

            if (!isTroopIdClaim) {
                openLoaderModal();
            }

            const claimedBoostUri = await wallet?.invoke?.claimBoostWithLink(
                boostUri || '',
                challenge || ''
            );
            await addCredentialToWallet({ uri: claimedBoostUri });

            const category = getDefaultCategoryForCredential((boost || {}) as any);
            const achievementType = getAchievementType((boost || {}) as any);

            if (boost) {
                logAnalyticsEvent('claim_boost', {
                    boostType: category,
                    achievementType,
                    method: 'Claim Modal',
                });
            }

            setIsClaimed(true);
            setIsClaimLoading(false);

            if (!isTroopIdClaim) {
                closeLoaderModal();
            }
            dismissClaimModal?.();

            history?.push('/');

            presentToast(`Successfully claimed Credential!`, {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
        } catch (e) {
            setIsClaimLoading(false);
            closeLoaderModal();

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

    useEffect(() => {
        getBoost();
    }, []);

    const credentialBodyOverride = <ClaimBoostBodyPreviewOverride boostVC={(boost || {}) as any} />;

    const handleClaimBoostAction = async () => {
        if (isLoggedIn && !loading) {
            handleClaimBoost();
        }
        if (!isLoggedIn && !loading) {
            openLoggedOutModal();
        }
    };
    let actionButtonText = 'Accept';

    if (isClaimLoading) {
        actionButtonText = 'Loading...';
    } else if (!isClaimLoading && isClaimed) {
        actionButtonText = 'Accepted';
    } else {
        actionButtonText = 'Accept';
    }

    const isTroopIdClaim = isTroopCredential(boost);

    const boostExists = !!boost && !loading;

    return (
        <IonPage>
            {/* <MainHeader
                showBackButton={false}
                customClassName="bg-white"
                customHeaderClass="main-header-branding-public-route"
            /> */}
            <IonContent fullscreen color="grayscale-100">
                <div className="px-[40px] pb-4 vc-preview-modal-safe-area h-full">
                    {!boostExists && (
                        <section className="relative loading-spinner-container flex flex-col items-center justify-center h-full w-full">
                            <IonSpinner color="black" />
                            <p className="mt-2 font-bold text-lg">Loading...</p>
                        </section>
                    )}
                    {!loading && !boost && (
                        <section className="flex flex-col pt-[10px] px-[20px] text-center justify-center">
                            <img
                                src={MiniGhost}
                                alt="currencies"
                                className="relative max-w-[250px] m-auto"
                            />
                            <h1 className="text-center text-3xl font-bold text-grayscale-800">
                                Eeek!
                            </h1>
                            <strong className="text-center font-medium text-grayscale-600">
                                Unable to find boost
                            </strong>
                        </section>
                    )}
                    <div role="presentation" className="spacer mt-4"></div>
                    {boostExists && (
                        <>
                            {!isTroopIdClaim ? (
                                <VCDisplayCardWrapper2
                                    credential={(boost || {}) as any}
                                    customBodyCardComponent={credentialBodyOverride}
                                    customFooterComponent={<div />}
                                    checkProof={false}
                                    brandingEnum={BrandingEnum.scoutPass}
                                    isFrontOverride={isFront}
                                    setIsFrontOverride={setIsFront}
                                    hideNavButtons
                                    unknownVerifierTitle={unknownVerifierTitle}
                                />
                            ) : (
                                <ViewTroopIdModal
                                    credential={(boost || {}) as any}
                                    boostUri={boostUri || ''}
                                    claimCredentialUri={boostUri || ''}
                                    useCurrentUserInfo
                                    isClaimMode
                                    isAlreadyClaimed={isClaimed} // TODO
                                    handleClaimOverride={handleClaimBoostAction}
                                    isClaimingOverride={isClaimLoading}
                                    className="fixed inset-0 overflow-y-auto"
                                    handleCloseOverride={handleCancel}
                                    showCounts={false}
                                />
                            )}
                        </>
                    )}
                </div>
            </IonContent>
            <IonRow className="relative z-10 w-full flex justify-center items-center gap-8">
                {!isTroopIdClaim && (
                    <BoostFooter
                        handleClose={handleCancel}
                        handleDetails={isFront ? () => setIsFront(!isFront) : undefined}
                        handleBack={!isFront ? () => setIsFront(!isFront) : undefined}
                        handleClaim={handleClaimBoostAction}
                        claimBtnText={actionButtonText}
                    />
                )}
            </IonRow>
        </IonPage>
    );
};

const ClaimBoost: React.FC = () => {
    const { newModal, closeAllModals } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const query = usePathQuery();
    const uriParam = query.get('boostUri') || undefined;
    const challengeParam = query.get('challenge') || undefined;

    useEffect(() => {
        // opens 2 modals for some reason, but looks fine...
        newModal(
            <ClaimBoostModal
                uri={uriParam}
                claimChallenge={challengeParam}
                dismissClaimModal={closeAllModals}
            />
        );
        // only open once per route load
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <IonPage className="bg-grayscale-100" />;
};

export default ClaimBoost;
