import React from 'react';

import { IonFooter } from '@ionic/react';
import TwoUsersIcon from 'learn-card-base/svgs/TwoUsers';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import ShareInsightsWithUser from '../share-insights/ShareInsightsWithUser';

import {
    useModal,
    UserProfilePicture,
    currentUserStore,
    ModalTypes,
    useToast,
    useForwardContractRequestToProfile,
} from 'learn-card-base';
import usePin from '../../../hooks/usePin';
import useConsentFlow from '../../consentFlow/useConsentFlow';
import { useGetAiInsightsServicesContract } from '../learner-insights/learner-insights.helpers';

import { LCNProfile } from '@learncard/types';
import { getProfileIdFromLCNDidWeb } from 'learn-card-base/helpers/credentialHelpers';

export const AiInsightsParentConsent: React.FC<{
    targetProfile: LCNProfile;
}> = ({ targetProfile }) => {
    const { closeAllModals, closeModal, newModal } = useModal();
    const { presentToast } = useToast();
    const { handleVerifyParentPin } = usePin();

    const { mutateAsync: forwardContractRequestToProfile } = useForwardContractRequestToProfile();
    const { contractUri: aiInsightsServicesContractUri, contract: aiInsightsServicesContract } =
        useGetAiInsightsServicesContract(targetProfile.did);
    const { openConsentFlowModal, hasConsented } = useConsentFlow(
        aiInsightsServicesContract,
        undefined,
        aiInsightsServicesContractUri
    );

    const parentUser = currentUserStore.useTracked.parentUser();
    const parentUserDid = currentUserStore.useTracked.parentUserDid();

    const handleParentSignIn = () => {
        handleVerifyParentPin({
            ignorePin: false,
            switchToParentAfterPin: false,
            onSuccess: () => {
                // open share modal again
                closeAllModals();

                if (aiInsightsServicesContract && aiInsightsServicesContractUri) {
                    setTimeout(() => {
                        openConsentFlowModal(
                            true,
                            () => presentToast('AI Insights shared!'),
                            targetProfile
                        );
                    }, 300);
                } else {
                    setTimeout(() => {
                        newModal(
                            <ShareInsightsWithUser
                                targetProfile={targetProfile}
                                bypassParentConsent
                            />,
                            { className: '!bg-transparent' },
                            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                        );
                    }, 300);
                }
            },
        });
    };

    const handleSendToAdult = async () => {
        await forwardContractRequestToProfile({
            parentProfileId: getProfileIdFromLCNDidWeb(parentUserDid),
            targetProfileId: targetProfile.profileId,
            contractUri: aiInsightsServicesContractUri ?? '',
        });

        closeModal();

        presentToast('Parent notified of share request!');
    };

    return (
        <div className="h-full w-full flex items-center justify-center">
            <div className="w-full flex items-center justify-center px-4 max-w-[400px]">
                <div className="bg-white pt-8 w-full flex flex-col items-center gap-4 justify-center shadow-box-bottom rounded-[24px]">
                    <p className="text-indigo-500 text-[25px] font-semibold text-center">
                        Get permission <br /> from an adult.
                    </p>
                    <div className="flex items-center gap-4">
                        <UserProfilePicture
                            customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px] text-[22px] font-semibold text-white"
                            customImageClass="w-full h-full object-cover"
                            user={parentUser}
                        />
                    </div>
                    <div className="w-full flex flex-col items-center gap-2 justify-between px-6 ion-padding">
                        <button
                            onClick={handleSendToAdult}
                            className="bg-indigo-500 py-[12px] rounded-[30px] font-notoSans text-[20px] font-semibold leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center mb-4"
                        >
                            Send to My Adult
                        </button>

                        <div className="w-full h-[1px] bg-grayscale-200" />

                        <button
                            onClick={handleParentSignIn}
                            className="py-[12px] rounded-[30px] font-notoSans text-[20px] font-semibold leading-[24px] tracking-[0.25px] text-grayscale-900 w-full  flex gap-[5px] items-center justify-between"
                        >
                            <span className="flex items-center gap-2">
                                <TwoUsersIcon /> Sign in as an adult
                            </span>
                            <SkinnyCaretRight className="text-grayscale-300" />
                        </button>
                    </div>
                </div>
            </div>

            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-grayscale-50 !max-h-[100px]"
            >
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center gap-2 justify-between max-w-[600px] ion-padding">
                        <button
                            onClick={closeModal}
                            className="bg-white py-[12px] rounded-[30px] font-notoSans text-[17px] font-semibold leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] items-center justify-center"
                        >
                            close
                        </button>
                    </div>
                </div>
            </IonFooter>
        </div>
    );
};

export default AiInsightsParentConsent;
