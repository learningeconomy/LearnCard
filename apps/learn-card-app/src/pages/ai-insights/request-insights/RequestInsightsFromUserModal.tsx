import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import queryString from 'query-string';

import RequestInsightsSkeletonLoader from './RequestInsightsSkeletonLoader';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import ConnectIcon from 'learn-card-base/svgs/ConnectIcon';
import { IonFooter, IonIcon } from '@ionic/react';
import X from 'learn-card-base/svgs/X';

import {
    useModal,
    UserProfilePicture,
    ProfilePicture,
    useSendAiInsightsContractRequest,
    useGetProfile,
    useToast,
    useGetCurrentLCNUser,
    useCurrentUser,
    useIsLoggedIn,
    useContractRequestStatusForProfile,
    redirectStore,
} from 'learn-card-base';
import { LCNProfile } from '@learncard/types';

import { useGetAiInsightsServicesContract } from '../learner-insights/learner-insights.helpers';
import { RequestInsightStatusEnum } from './request-insights.helpers';
import { person } from 'ionicons/icons';

export const RequestInsightsFromUserModal: React.FC<{
    profile: LCNProfile;
    contractUri: string;
    onSuccessCallback?: () => void;
    redirectToLink?: string;
    requestStatus?: 'pending' | 'accepted' | 'denied' | null;
}> = ({ profile, contractUri, onSuccessCallback, redirectToLink, requestStatus }) => {
    const { presentToast } = useToast();
    const { closeModal, closeAllModals } = useModal();
    const history = useHistory();
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();

    const isAuthenticated = Boolean(currentUser) && isLoggedIn;
    const isPendingRequest = requestStatus === RequestInsightStatusEnum.pending;
    const isAcceptedRequest = requestStatus === RequestInsightStatusEnum.accepted;

    const { mutateAsync: sendAiInsightsContractRequest, isPending } =
        useSendAiInsightsContractRequest();

    const handleSendRequest = async () => {
        const profileId = profile?.profileId ?? '';

        if (isPendingRequest) {
            presentToast('Insights request already pending.');
            return;
        }

        if (isAcceptedRequest) {
            presentToast('Insights request already accepted.');
            return;
        }

        if (!isAuthenticated) {
            redirectStore.set.authRedirect(redirectToLink || '/login');
            closeModal();
            history.push(`/login?redirectTo=${encodeURIComponent(redirectToLink || '/login')}`);
            return;
        }

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

    let requestButtonLabel = 'Login to Request';

    if (isPending) requestButtonLabel = 'Sending...';
    else if (isPendingRequest) requestButtonLabel = 'Request Pending';
    else if (isAcceptedRequest) requestButtonLabel = 'Request Accepted';
    else if (isAuthenticated) requestButtonLabel = 'Send Request';

    return (
        <div className="h-full w-full flex items-center justify-center">
            <div className="w-full flex items-center justify-center px-4 max-w-[600px]">
                <div className="bg-white py-12 w-full flex flex-col items-center gap-4 justify-center shadow-box-bottom rounded-[24px]">
                    <div className="flex items-center gap-4">
                        {isAuthenticated ? (
                            <ProfilePicture
                                customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px]"
                                customImageClass="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="bg-grayscale-200 text-grayscale-700 h-[64px] w-[64px] min-h-[64px] min-w-[64px] rounded-full flex items-center justify-center text-sm font-semibold">
                                <IonIcon icon={person} className="h-4 w-4" />
                            </div>
                        )}

                        <ConnectIcon className="text-grayscale-900 h-[48px] w-[48px]" />

                        <UserProfilePicture
                            customContainerClass="text-grayscale-900 h-[64px] w-[64px] min-h-[64px] min-w-[64px] text-[22px] font-semibold text-white"
                            customImageClass="w-full h-full object-cover"
                            user={profile}
                        />
                    </div>
                    {isAuthenticated ? (
                        <p className="text-grayscale-900 text-[22px] font-semibold text-center">
                            Request Insights from <br /> {profile?.displayName}
                        </p>
                    ) : (
                        <p className="text-grayscale-900 text-[16px] text-center">
                            Please <span className="font-semibold">Login</span> to{' '}
                            <span className="font-semibold">Request Insights</span> from <br />{' '}
                            <span className="font-semibold">{profile?.displayName}</span>
                        </p>
                    )}
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
                            disabled={isPending || isPendingRequest || isAcceptedRequest}
                            onClick={handleSendRequest}
                            className="bg-indigo-500 py-[12px] rounded-[30px] font-notoSans text-[17px] font-semibold leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center"
                        >
                            {requestButtonLabel}
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

export const RequestInsightsFromUserModalWrapper: React.FC<{
    profileId: string;
    redirectToLink: string;
}> = ({ profileId, redirectToLink }) => {
    const history = useHistory();
    const location = useLocation();
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { data: profile, isLoading } = useGetProfile(profileId);

    const isAuthenticated = Boolean(currentUser) && isLoggedIn && Boolean(currentLCNUser?.did);

    const { contractUri, isLoading: contractLoading } = useGetAiInsightsServicesContract(
        currentLCNUser?.did ?? '',
        isAuthenticated
    );
    const { data: requestData, isLoading: requestLoading } = useContractRequestStatusForProfile(
        undefined,
        contractUri ?? '',
        profileId
    );

    const onSuccessCallback = () => {
        // clear route params
        const params = queryString.parse(location.search);
        const { shareInsights, learnerProfileId, ...allOtherSearchParams } = params;
        history.replace({ search: queryString.stringify(allOtherSearchParams) });
    };

    if (isLoading || (isAuthenticated && contractLoading) || requestLoading) {
        return <RequestInsightsSkeletonLoader />;
    }

    return (
        <RequestInsightsFromUserModal
            profile={profile}
            contractUri={contractUri ?? ''}
            onSuccessCallback={onSuccessCallback}
            redirectToLink={redirectToLink}
            requestStatus={requestData?.status}
        />
    );
};

export default RequestInsightsFromUserModal;
