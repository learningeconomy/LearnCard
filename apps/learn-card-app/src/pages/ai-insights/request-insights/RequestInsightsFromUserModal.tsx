import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';

import RequestInsightsSkeletonLoader from './RequestInsightsSkeletonLoader';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import ConnectIcon from 'learn-card-base/svgs/ConnectIcon';
import { IonFooter } from '@ionic/react';
import X from 'learn-card-base/svgs/X';

import {
    useModal,
    UserProfilePicture,
    ProfilePicture,
    useSendAiInsightsContractRequest,
    useGetProfile,
    useToast,
    useGetCurrentLCNUser,
} from 'learn-card-base';
import { LCNProfile } from '@learncard/types';

import { useGetAiInsightsServicesContract } from '../learner-insights/learner-insights.helpers';

export const RequestInsightsFromUserModal: React.FC<{
    profile: LCNProfile;
    contractUri: string;
    onSuccessCallback?: () => void;
}> = ({ profile, contractUri, onSuccessCallback }) => {
    const { presentToast } = useToast();
    const { closeModal, closeAllModals } = useModal();

    const { mutateAsync: sendAiInsightsContractRequest, isPending } =
        useSendAiInsightsContractRequest();

    const handleSendRequest = async () => {
        const profileId = profile?.profileId ?? '';

        const shareLink = `${
            IS_PRODUCTION ? 'https://learncard.app' : 'http://localhost:3000'
        }/passport?contractUri=${contractUri}&teacherProfileId=${profileId}&insightsConsent=true`;

        await sendAiInsightsContractRequest({
            contractUri: contractUri ?? '',
            targetProfileId: profileId,
            shareLink,
        });
        closeModal();

        presentToast('AI Insights request sent!');

        onSuccessCallback?.();
    };

    return (
        <div className="h-full w-full flex items-center justify-center">
            <div className="w-full flex items-center justify-center px-4 max-w-[600px]">
                <div className="bg-white py-12 w-full flex flex-col items-center gap-4 justify-center shadow-box-bottom rounded-[24px]">
                    <div className="flex items-center gap-4">
                        <ProfilePicture
                            customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px]"
                            customImageClass="w-full h-full object-cover"
                        />

                        <ConnectIcon className="text-grayscale-900 h-[48px] w-[48px]" />

                        <UserProfilePicture
                            customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px] text-[22px] font-semibold text-white"
                            customImageClass="w-full h-full object-cover"
                            user={profile}
                        />
                    </div>
                    <p className="text-grayscale-900 text-[22px] font-semibold text-center">
                        Request Insights from <br /> {profile?.displayName}
                    </p>
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
                            disabled={isPending}
                            onClick={handleSendRequest}
                            className="bg-indigo-500 py-[12px] rounded-[30px] font-notoSans text-[17px] font-semibold leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center"
                        >
                            {isPending ? 'Sending...' : 'Send Request'}
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

export const RequestInsightsFromUserModalWrapper: React.FC<{ profileId: string }> = ({
    profileId,
}) => {
    const history = useHistory();
    const location = useLocation();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { data: profile, isLoading } = useGetProfile(profileId);

    const { contractUri, isLoading: contractLoading } = useGetAiInsightsServicesContract(
        currentLCNUser?.did!,
        true
    );

    const onSuccessCallback = () => {
        // clear route params
        const params = queryString.parse(location.search);
        const { shareInsights, learnerProfileId, ...allOtherSearchParams } = params;
        history.replace({ search: queryString.stringify(allOtherSearchParams) });
    };

    if (isLoading || contractLoading) {
        return <RequestInsightsSkeletonLoader />;
    }

    return (
        <RequestInsightsFromUserModal
            profile={profile}
            contractUri={contractUri}
            onSuccessCallback={onSuccessCallback}
        />
    );
};

export default RequestInsightsFromUserModal;
