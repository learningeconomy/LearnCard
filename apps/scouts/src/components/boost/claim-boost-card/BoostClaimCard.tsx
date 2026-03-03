import React, { useState, useCallback, useMemo } from 'react';

import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { useClaimCredential, BrandingEnum } from 'learn-card-base';
import useFirebaseAnalytics from '../../../hooks/useFirebaseAnalytics';
import { IonContent, IonRow, IonSpinner, IonPage, IonFooter } from '@ionic/react';

import Lottie from 'react-lottie-player';
import HourGlass from '../../../assets/lotties/hourglass.json';
import BoostFooter from 'learn-card-base/components/boost/boostFooter/BoostFooter';
import VCDisplayCardWrapper2 from 'learn-card-base/components/vcmodal/VCDisplayCardWrapper2';

import { VC, VP } from '@learncard/types';

import {
    getAchievementType,
    getDefaultCategoryForCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { useHighlightedCredentials } from '../../../hooks/useHighlightedCredentials';
import { getRoleFromCred, getScoutsNounForRole } from '../../../helpers/troop.helpers';

type BoostClaimCardProps = {
    credential: VC | VP;
    dismiss: ({ historyPush, callback }) => void;
    showFooter?: boolean;
    credentialUri?: string;
    // boost claiming
    showBoostFooter?: boolean;
    handleClaimBoostCredential?: () => boolean;
    isLoading?: boolean;
    acceptCredentialLoading?: boolean;
    acceptCredentialCompleted?: boolean;
    successCallback?: () => void;
};

/* TODO REWRITE THIS, was originally just for normal VCs but we have added additional boost related logic,
 and it's a big mess
 need to extract from it and make pure display component */
export const BoostClaimCard: React.FC<BoostClaimCardProps> = ({
    credential,
    dismiss,
    showFooter = true,
    // boost claiming
    showBoostFooter = false,
    handleClaimBoostCredential = () => false,
    isLoading = false,
    acceptCredentialCompleted,
    credentialUri,
    successCallback,
}) => {
    const isLoggedIn = useIsLoggedIn();
    const { logAnalyticsEvent } = useFirebaseAnalytics();

    const [isFront, setIsFront] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Extract issuer DID and profileID for scouts role logic
    const issuerDid = 
        typeof credential?.issuer === 'string' ? credential.issuer : credential?.issuer?.id;
    const profileID = issuerDid?.split(':').pop();

    // Fetch highlighted credentials to get the issuer's role
    const { credentials: highlightedCreds } = useHighlightedCredentials(profileID);
    
    // Compute unknownVerifierTitle based on the role (same logic as BoostPreview)
    const unknownVerifierTitle = useMemo(() => {
        if (!highlightedCreds || highlightedCreds.length === 0) return undefined;

        const role = getRoleFromCred(highlightedCreds[0]);
        return getScoutsNounForRole(role);
    }, [highlightedCreds]);

    const { handleClaimCredential, isClaiming, isClaimed } = useClaimCredential(credentialUri, {
        successCallback,
        dismiss,
        isClaimedInitialState: acceptCredentialCompleted,
    });

    const handleDismiss = async () => {
        if (isLoggedIn) {
            dismiss?.({ historyPush: null, callback: null });
        }
    };

    const handleImageClick = useCallback((url: string) => {
        setSelectedImage(url);
    }, []);

    const isID = credential?.display?.displayType === 'id' || false;

    let claimStatusText;

    if (!isClaiming && isLoggedIn && credential && isClaimed) {
        claimStatusText = 'Claimed';
    }
    if (isClaiming && isLoggedIn) {
        claimStatusText = 'Saving...';
    }

    if (!isClaiming && isLoggedIn && credential && !isClaimed) {
        claimStatusText = 'Accept';
    }

    return (
        <IonPage>
            <IonContent
                fullscreen
                className={`flex items-center justify-center ion-padding boost-cms-preview transition-colors [&::part(scroll)]:px-0 gradient-mask-b-80`}
            >
                <IonRow className="flex flex-col items-center justify-center px-6 overflow-x-auto safe-area-top-margin pb-32">
                    {isClaiming && (
                        <div className="absolute w-full h-full top-0 left-0 z-50 flex items-center justify-center flex-col boost-loading-wrapper">
                            <div className="w-[180px] h-full m-auto mt-[5px] flex items-center justify-center">
                                <Lottie
                                    loop
                                    animationData={HourGlass}
                                    play
                                    style={{ width: '180px', height: '180px' }}
                                />
                            </div>
                        </div>
                    )}
                    <section className={`px-6 w-full ${isID ? '!px-0' : ''}`}>
                        {credential && (
                            <VCDisplayCardWrapper2
                                credential={credential}
                                hideNavButtons
                                isFrontOverride={isFront}
                                setIsFrontOverride={setIsFront}
                                brandingEnum={BrandingEnum.scoutPass}
                                onMediaClick={handleImageClick}
                                unknownVerifierTitle={unknownVerifierTitle}
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
                </IonRow>
            </IonContent>
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border absolute bottom-0"
            >
                <IonRow className="relative z-10 w-full flex flex-nowrap justify-center items-center gap-4">
                    <BoostFooter
                        handleClose={() => {
                            handleDismiss({ redirectToLogin: true });
                        }}
                        handleDetails={isFront ? () => setIsFront(!isFront) : undefined}
                        handleBack={!isFront ? () => setIsFront(!isFront) : undefined}
                        handleClaim={async () => {
                            await handleClaimCredential();

                            if (credential) {
                                const category = getDefaultCategoryForCredential(credential);
                                const achievementType = getAchievementType(credential);

                                logAnalyticsEvent('claim_boost', {
                                    category: category,
                                    boostType: achievementType,
                                    method: 'Notification',
                                });
                            }
                        }}
                        claimBtnText={claimStatusText}
                    />
                </IonRow>
            </IonFooter>
        </IonPage>
    );
};

export default BoostClaimCard;
