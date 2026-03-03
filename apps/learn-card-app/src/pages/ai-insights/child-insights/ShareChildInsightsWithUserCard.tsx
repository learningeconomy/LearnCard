import React, { useEffect, useState } from 'react';

import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import ShareInsightsWithUser from '../share-insights/ShareInsightsWithUser';

import {
    UserProfilePicture,
    useModal,
    ModalTypes,
    useSwitchProfile,
    switchedProfileStore,
} from 'learn-card-base';
import useConsentFlow from '../../consentFlow/useConsentFlow';

import { LCNProfile, LCNProfileManager } from '@learncard/types';
import { useGetAiInsightsServicesContract } from '../learner-insights/learner-insights.helpers';

export const ShareChildInsightsWithUserCard: React.FC<{
    childProfile: LCNProfile;
    childProfileManager: LCNProfileManager;
    profile: LCNProfile;
    containerClassName?: string;
    imageContainerClassName?: string;
    imageClassName?: string;
}> = ({
    childProfile,
    childProfileManager,
    profile,
    containerClassName,
    imageContainerClassName,
    imageClassName,
}) => {
    const { newModal } = useModal();
    const { handleSwitchAccount, handleSwitchBackToParentAccount } = useSwitchProfile();
    const switchedDid = switchedProfileStore.use.switchedDid();

    const [pendingShare, setPendingShare] = useState(false);
    const { contractUri: aiInsightsServicesContractUri, contract: aiInsightsServicesContract } =
        useGetAiInsightsServicesContract(profile.did);
    const { openConsentFlowModal, hasConsented } = useConsentFlow(
        aiInsightsServicesContract,
        undefined,
        aiInsightsServicesContractUri
    );

    const name = profile?.displayName;
    const username = profile?.profileId;
    const role = profile?.role ?? 'Learner';
    const subText = `@${username}`;

    const handleCallback = () => {
        handleSwitchBackToParentAccount();
    };

    const handleShareInsights = async () => {
        if (aiInsightsServicesContractUri && aiInsightsServicesContract) {
            setPendingShare(true);
            await handleSwitchAccount(childProfile);
        } else {
            newModal(
                <ShareInsightsWithUser
                    targetProfile={profile}
                    childProfileId={childProfile.profileId}
                    bypassParentConsent
                />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        }
    };

    useEffect(() => {
        if (pendingShare && switchedDid === childProfile.did) {
            openConsentFlowModal(
                true,
                undefined,
                profile?.profileId,
                childProfile?.profileId,
                true,
                handleCallback,
                handleCallback
            );
            setPendingShare(false);
        }
    }, [pendingShare, switchedDid, childProfile.did, openConsentFlowModal, profile?.profileId]);

    const imageStyles = 'h-[50px] w-[50px] min-w-[50px] min-h-[50px]';

    return (
        <div
            role="button"
            className={`w-full flex items-center justify-between px-2 py-2 first:mt-2 relative ${containerClassName}`}
            onClick={() => handleShareInsights()}
        >
            <div className="flex items-center gap-2">
                <div className="relative">
                    <UserProfilePicture
                        customContainerClass={`flex justify-center items-center  rounded-full overflow-hidden border-white border-solid border-[3px] text-white font-medium text-xl ${imageStyles} ${imageClassName} ${imageContainerClassName}`}
                        customImageClass={`flex justify-center items-center  rounded-full overflow-hidden object-cover border-white border-solid border-2 ${imageStyles} ${imageClassName} ${imageContainerClassName}`}
                        customSize={120}
                        user={profile}
                    />
                </div>
                <div className="flex flex-col text-left">
                    <p className="text-grayscale-900 text-[17px] font-semibold">{name}</p>
                    <p className="text-grayscale-600 text-sm font-semibold">
                        {role && <span className="font-semibold capitalize">{role} • </span>}
                        {subText}
                    </p>
                </div>
            </div>

            <SkinnyCaretRight className="text-grayscale-400 h-[24px] w-[20px] min-h-[20px] min-w-[20px]" />
        </div>
    );
};

export default ShareChildInsightsWithUserCard;
