import React, { useState } from 'react';

import X from 'learn-card-base/svgs/X';
import LockBroken from 'learn-card-base/svgs/LockBroken';
import SlimCaretRight from 'apps/learn-card-app/src/components/svgs/SlimCaretRight';

import { toastStore } from 'learn-card-base/stores/toastStore';
import {
    useCancelContractRequest,
    useContractRequestStatusForProfile,
    useGetCurrentLCNUser,
    useAllContractRequestsForProfile,
} from 'learn-card-base';
import { ConsentFlowContract, LCNProfile } from '@learncard/types';

export const AiInsightsInlineConsentFlowRequest: React.FC<{
    contractDetails: ConsentFlowContract;
    handleOpenPrivacyAndData: () => void;
    handleAccept: () => void;
    insightsProfile: LCNProfile;
    options?: {
        className?: string;
        isInline?: boolean;
        useDarkText?: boolean;
        hideCloseButton?: boolean;
    };
}> = ({ contractDetails, handleOpenPrivacyAndData, handleAccept, insightsProfile, options }) => {
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { data: requestStatus, refetch } = useContractRequestStatusForProfile(
        undefined,
        contractDetails?.uri,
        currentLCNUser?.profileId
    );

    const { data: contractRequests = [], refetch: refetchContractRequests } =
        useAllContractRequestsForProfile(currentLCNUser?.profileId ?? '');
    const { mutateAsync: cancelRequest } = useCancelContractRequest();

    const [isExpanded, setIsExpanded] = useState(false);
    const { hideCloseButton, useDarkText, isInline } = options || {};

    const borderColor = useDarkText ? 'border-grayscale-300' : 'border-grayscale-200';
    const buttonStyle = isInline ? 'shadow-button-bottom' : '';

    const handleDeny = async () => {
        if (requestStatus?.status === 'accepted') return;
        await cancelRequest(contractDetails?.uri, currentLCNUser?.profileId);
        await refetch();
        await refetchContractRequests();
    };

    return (
        <>
            {!hideCloseButton && (
                <button
                    type="button"
                    onClick={() => toastStore.set.dismissToast()}
                    className="absolute top-[-10px] left-[-16px] border border-grayscale-200 border-solid p-3 rounded-full h-[35px] w-[35px] flex items-center justify-center bg-grayscale-200 phone:hidden"
                >
                    <X className="text-grayscale-900 h-[15px] w-[15px] min-w-[15px] min-h-[15px]" />
                </button>
            )}
            <div className="w-full flex flex-col items-start justify-center gap-2 relative">
                <div className="flex items-center gap-2 w-full">
                    <button
                        onClick={handleDeny}
                        className={`text-grayscale-900 flex-1 text-sm font-semibold bg-white px-4 py-2 rounded-full border border-grayscale-200 border-solid ${buttonStyle}`}
                    >
                        Deny
                    </button>
                    <button
                        onClick={handleAccept}
                        className="text-white flex-1 text-sm font-semibold px-4 py-2 rounded-full bg-indigo-500"
                    >
                        Approve
                    </button>
                    {!hideCloseButton && (
                        <button
                            type="button"
                            onClick={() => toastStore.set.dismissToast()}
                            className="border border-grayscale-200 border-solid p-3 rounded-full h-[45px] w-[45px] hidden items-center justify-center bg-white phone:flex"
                        >
                            <X className="text-grayscale-900 h-[20px] w-[20px]" />
                        </button>
                    )}
                </div>

                {isExpanded && (
                    <div
                        className={`w-full flex flex-col items-start justify-center gap-2 border-t ${borderColor} border-solid pt-2 mt-2`}
                    >
                        <div className="w-full flex flex-col items-start justify-center gap-2 mt-2">
                            <p className="text-grayscale-900 text-sm text-left">
                                {insightsProfile?.displayName} {insightsProfile?.shortBio}
                            </p>
                            <p className="text-grayscale-900 text-sm text-left">
                                If you approve, your teacher will be able to to see your Top Skills,
                                Learning Snapshots, Suggested Pathways. They will also be able to
                                send learning pathway suggestions to you.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                toastStore.set.setOptions({ zIndex: 99999 });
                                handleOpenPrivacyAndData();
                            }}
                            className={`mt-2 flex gap-[5px] items-center w-full text-grayscale-900 font-notoSans text-[20px] py-[10px] px-2 border-[1px] border-solid rounded-[15px] ${borderColor}`}
                        >
                            <LockBroken />
                            Privacy & Data
                            <SlimCaretRight className="h-[20px] w-[20px] ml-auto text-grayscale-500" />
                        </button>
                    </div>
                )}
                <div
                    className={`w-full flex items-center justify-center pb-2 ${
                        isExpanded ? '' : 'border-t border-grayscale-200 border-solid'
                    }`}
                >
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`text-xs font-semibold mt-2 ${
                            useDarkText ? 'text-grayscale-900 underline' : 'text-indigo-500'
                        }`}
                    >
                        {isExpanded ? 'Got it.' : 'Learn more'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default AiInsightsInlineConsentFlowRequest;
