import React from 'react';

import AiInsightsParentConsent from '../ai-insights-parent-consent/AiInsightsParentConsent';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import ConnectIcon from 'learn-card-base/svgs/ConnectIcon';
import { IonFooter } from '@ionic/react';
import X from 'learn-card-base/svgs/X';

import {
    useModal,
    UserProfilePicture,
    ProfilePicture,
    useSendAiInsightsShareRequest,
    useGetCurrentLCNUser,
    switchedProfileStore,
    ModalTypes,
    useToast,
    useGetProfile,
    useCurrentUser,
} from 'learn-card-base';

import { LCNProfile } from '@learncard/types';

export const ShareInsightsWithUser: React.FC<{
    targetProfile: LCNProfile | string;
    childProfileId?: string;
    bypassParentConsent?: boolean;
}> = ({ targetProfile, childProfileId, bypassParentConsent }) => {
    const { presentToast } = useToast();
    const { closeModal, closeAllModals, newModal } = useModal();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const currentUser = useCurrentUser();

    const profileType = switchedProfileStore.use.profileType();
    const isChild = profileType === 'child';

    const { mutateAsync: sendShareRequest } = useSendAiInsightsShareRequest();

    const { data: childProfile } = useGetProfile(childProfileId, !!childProfileId);
    const { data: _targetProfile } = useGetProfile(
        typeof targetProfile === 'string' ? targetProfile : targetProfile.profileId,
        !!targetProfile
    );

    const handleShareInsights = async () => {
        if (isChild && !bypassParentConsent) {
            closeModal();
            newModal(
                <AiInsightsParentConsent targetProfile={_targetProfile} />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
            return;
        }

        const insightsProfileIdToShare = childProfileId ?? currentLCNUser?.profileId;

        const overrideShareLink = `${
            IS_PRODUCTION ? 'https://learncard.app' : 'http://localhost:3000'
        }/passport?shareInsights=true&learnerProfileId=${insightsProfileIdToShare}`;

        await sendShareRequest({
            targetProfileId: _targetProfile?.profileId,
            shareLink: overrideShareLink,
            childProfileId,
        });

        presentToast('Insights shared!');
        closeModal();
    };

    let buttonText = 'Share Insights';
    if (isChild && !bypassParentConsent) buttonText = 'Get Permission';

    let text = (
        <p className="text-grayscale-900 text-[22px] font-semibold text-center">
            Share Insights with <br /> {_targetProfile?.displayName}
        </p>
    );

    if (childProfile || isChild) {
        let childName = currentUser?.name || currentLCNUser?.displayName;
        if (childProfile && childProfile.displayName) childName = childProfile.displayName;

        text = (
            <p className="text-grayscale-900 text-[17px] text-center">
                <span className="font-semibold">{childName}</span> wants to share their insights
                with <span className="font-semibold">{_targetProfile?.displayName}</span>
            </p>
        );
    }

    return (
        <div className="h-full w-full flex items-center justify-center">
            <div className="w-full flex items-center justify-center px-6 max-w-[600px]">
                <div className="bg-white py-12 w-full flex flex-col items-center gap-4 justify-center shadow-box-bottom rounded-[24px]">
                    <div className="flex items-center gap-4">
                        {childProfile ? (
                            <UserProfilePicture
                                customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px] text-[22px] font-semibold text-white"
                                customImageClass="w-full h-full object-cover"
                                user={childProfile}
                            />
                        ) : (
                            <ProfilePicture
                                customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px]"
                                customImageClass="w-full h-full object-cover"
                            />
                        )}

                        <ConnectIcon className="text-grayscale-900 h-[48px] w-[48px]" />

                        <UserProfilePicture
                            customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px] text-[22px] font-semibold text-white"
                            customImageClass="w-full h-full object-cover"
                            user={_targetProfile}
                        />
                    </div>
                    {text}
                </div>
            </div>

            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-grayscale-50 !max-h-[100px]"
            >
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center gap-2 justify-between max-w-[600px] ion-padding">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="bg-white p-3 rounded-full h-[45px] w-[45px] flex items-center justify-center shadow-button-bottom"
                        >
                            <SkinnyCaretRight className="text-grayscale-900 h-[45px] w-[45px] rotate-180" />
                        </button>

                        <button
                            onClick={handleShareInsights}
                            className="bg-indigo-500 py-[12px] rounded-[30px] font-notoSans text-[17px] font-semibold leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center"
                        >
                            {buttonText}
                        </button>

                        <button
                            type="button"
                            onClick={closeAllModals}
                            className="bg-white p-3 rounded-full h-[45px] w-[45px] flex items-center justify-center mr-2 shadow-button-bottom"
                        >
                            <X className="text-grayscale-900 h-[45px] w-[45px]" />
                        </button>
                    </div>
                </div>
            </IonFooter>
        </div>
    );
};

export const ShareInsightsWithUserWrapper: React.FC<{
    targetProfileId: string;
}> = ({ targetProfileId }) => {
    const { data: targetProfile } = useGetProfile(targetProfileId, !!targetProfileId);

    if (!targetProfile) return null;

    return <ShareInsightsWithUser targetProfile={targetProfile} />;
};

export default ShareInsightsWithUser;
