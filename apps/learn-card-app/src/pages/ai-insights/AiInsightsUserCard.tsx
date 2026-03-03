import React from 'react';

import { ThreeDotVertical } from '@learncard/react';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import SkinnyCaretRight from 'learn-card-base/svgs/SkinnyCaretRight';
import ShareInsightsWithUser from './share-insights/ShareInsightsWithUser';
import LearnerInsightsPreview from './learner-insights/LearnerInsightsPreview';
import RequestInsightsFromUserModal from './request-insights/RequestInsightsFromUserModal';
import RequestInsightsUserCardOptions from './request-insights/RequestInsightsUserCardOptions';
import LearnerInsightsSkillsCount from './learner-insights/LearnerInsightsSkillsCount';

import {
    UserProfilePicture,
    useModal,
    ModalTypes,
    useMarkContractRequestAsSeen,
    useContractSentRequests,
    useCancelContractRequest,
    useContractRequestStatusForProfile,
    switchedProfileStore,
    useConfirmation,
} from 'learn-card-base';
import useConsentFlow from '../consentFlow/useConsentFlow';

import { LCNProfile } from '@learncard/types';
import { RequestInsightStatusEnum } from './request-insights/request-insights.helpers';
import { AiInsightsUserCardMode } from './ai-insights.helpers';
import { useGetAiInsightsServicesContract } from './learner-insights/learner-insights.helpers';

export const AiInsightsUserCard: React.FC<{
    profile: LCNProfile;
    mode?: AiInsightsUserCardMode;
    showOptions?: boolean;
    containerClassName?: string;
    imageContainerClassName?: string;
    imageClassName?: string;
    contractUri?: string;
    readStatus?: 'unseen' | 'seen' | null | undefined;
    status?: 'pending' | 'accepted' | 'denied' | null | undefined;
}> = ({
    profile,
    mode = AiInsightsUserCardMode.Request,
    showOptions = false,
    containerClassName,
    imageContainerClassName,
    imageClassName,
    contractUri = '',
    status,
    readStatus,
}) => {
    const { newModal } = useModal();
    const confirm = useConfirmation();

    const { contractUri: aiInsightsServicesContractUri, contract: aiInsightsServicesContract } =
        useGetAiInsightsServicesContract(profile.did);
    const { openConsentFlowModal, hasConsented } = useConsentFlow(
        aiInsightsServicesContract,
        undefined,
        aiInsightsServicesContractUri
    );

    const { mutateAsync: markRequestAsSeen } = useMarkContractRequestAsSeen();
    const { mutateAsync: cancelRequest } = useCancelContractRequest();
    const { refetch: refetchContracts } = useContractSentRequests(contractUri);

    const profileType = switchedProfileStore.use.profileType();
    const isChild = profileType === 'child';

    const name = profile?.displayName;
    const username = profile?.profileId;
    const role = profile?.role ?? 'Learner';

    const requestStatus = status;
    const isNewInsight = readStatus === 'unseen';

    const handleRequestInsights = async (m?: AiInsightsUserCardMode) => {
        if (m === AiInsightsUserCardMode.Cancel) {
            if (
                await confirm({
                    text: `Are you sure you want to cancel this Insights request?`,
                    cancelButtonClassName:
                        'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px] ',
                    confirmButtonClassName:
                        'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
                })
            ) {
                await cancelRequest({
                    contractUri,
                    targetProfileId: profile.profileId,
                });
                await refetchContracts();
            }
            return;
        } else if (mode === AiInsightsUserCardMode.Share) {
            if (aiInsightsServicesContractUri && aiInsightsServicesContract && !isChild) {
                openConsentFlowModal(true, undefined, profile);
            } else {
                newModal(
                    <ShareInsightsWithUser targetProfile={profile} />,
                    { className: '!bg-transparent' },
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
            }
            return;
        } else if (
            mode === AiInsightsUserCardMode.Request ||
            m === AiInsightsUserCardMode.Request ||
            status === 'pending' ||
            !status
        ) {
            newModal(
                <RequestInsightsFromUserModal profile={profile} contractUri={contractUri} />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
            return;
        } else if (mode === AiInsightsUserCardMode.View || status === 'accepted') {
            await markRequestAsSeen({
                contractUri,
                targetProfileId: profile.profileId,
            });
            await refetchContracts();

            newModal(
                <LearnerInsightsPreview
                    profile={profile}
                    readStatus={readStatus}
                    status={requestStatus}
                />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
            );
            return;
        }
    };

    const handleThreeDotMenu = () => {
        if (mode === AiInsightsUserCardMode.View || mode === AiInsightsUserCardMode.Preview) {
            newModal(
                <RequestInsightsUserCardOptions
                    profile={profile}
                    status={requestStatus}
                    readStatus={readStatus}
                    handleRequestInsights={handleRequestInsights}
                />,
                {},
                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
            );
        }
    };

    const containerStyles =
        mode === AiInsightsUserCardMode.Request || mode === AiInsightsUserCardMode.Share
            ? ''
            : 'bg-white rounded-[15px] shadow-soft-bottom py-4';

    const imageStyles =
        mode === AiInsightsUserCardMode.Request || mode === AiInsightsUserCardMode.Share
            ? 'h-[50px] w-[50px] min-w-[50px] min-h-[50px]'
            : 'h-[60px] w-[60px] min-w-[60px] min-h-[60px]';

    let subText: string | React.ReactNode = '';
    if (mode === AiInsightsUserCardMode.View || mode === AiInsightsUserCardMode.Preview) {
        if (requestStatus === RequestInsightStatusEnum.pending) {
            subText = <span className="font-semibold text-indigo-600">Pending</span>;
        }

        if (requestStatus === RequestInsightStatusEnum.accepted) {
            subText = <LearnerInsightsSkillsCount profile={profile} />;
        }
    } else if (mode === AiInsightsUserCardMode.Request || mode === AiInsightsUserCardMode.Share) {
        subText = `@${username}`;
    }

    return (
        <div
            role="button"
            className={`w-full flex items-center justify-between px-2 py-2 first:mt-2 relative ${containerStyles} ${containerClassName}`}
            onClick={() => handleRequestInsights()}
        >
            <div className="flex items-center gap-2">
                <div className="relative">
                    {isNewInsight && (
                        <div className="absolute top-0 left-0 h-[20px] w-[20px] bg-emerald-500 rounded-full flex items-center justify-center z-10 border border-solid border-white">
                            <Checkmark className="text-white h-[20px] w-[20px] min-h-[20px] min-w-[20px]" />
                        </div>
                    )}

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
            {(mode === AiInsightsUserCardMode.Request || mode === AiInsightsUserCardMode.Share) && (
                <SkinnyCaretRight className="text-grayscale-400 h-[24px] w-[20px] min-h-[20px] min-w-[20px]" />
            )}
            {(mode === AiInsightsUserCardMode.View || mode === AiInsightsUserCardMode.Preview) &&
                showOptions && (
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            handleThreeDotMenu();
                        }}
                    >
                        <ThreeDotVertical className="absolute right-2 top-5 text-grayscale-400 h-[24px] w-[20px] min-h-[20px] min-w-[20px]" />
                    </button>
                )}
        </div>
    );
};

export const AiInsightsUserCardWrapper: React.FC<{ profile: LCNProfile; contractUri: string }> = ({
    profile,
    contractUri,
}) => {
    const { data } = useContractRequestStatusForProfile(undefined, contractUri, profile.profileId);

    const status = data?.status;
    const readStatus = data?.readStatus;

    let mode = AiInsightsUserCardMode.Request;
    if (status === 'accepted') {
        mode = AiInsightsUserCardMode.View;
    }

    return (
        <AiInsightsUserCard
            profile={profile}
            contractUri={contractUri}
            status={status}
            readStatus={readStatus}
            mode={mode}
            containerClassName="!shadow-none !p-4"
            imageContainerClassName="h-[50px] w-[50px] min-w-[50px] min-h-[50px]"
        />
    );
};

export default AiInsightsUserCard;
