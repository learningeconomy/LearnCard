import React from 'react';

import { switchedProfileStore, UserProfilePicture } from 'learn-card-base';
import FullScreenConsentFlow from '../../consentFlow/FullScreenConsentFlow';

import { useContract, useGetCurrentLCNUser, useModal, ModalTypes } from 'learn-card-base';
import AiInsightsParentConsent from '../ai-insights-parent-consent/AiInsightsParentConsent';
import { LCNProfile } from '@learncard/types';

export const AiInsightsUserRequestsToast: React.FC<{
    contractUri: string;

    options?: {
        className?: string;
        isInline?: boolean;
        useDarkText?: boolean;
        hideCloseButton?: boolean;
    };
}> = ({ contractUri, options }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const { currentLCNUser } = useGetCurrentLCNUser();

    const isChild = switchedProfileStore.use.profileType() === 'child';

    const { data: contract } = useContract(contractUri, !!contractUri);

    const handleGetPermission = () => {
        newModal(
            <AiInsightsParentConsent targetProfile={contract?.owner as LCNProfile} />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    if (!contract) return null;

    return (
        <div
            className={`flex flex-col items-center justify-start w-full gap-2 ${options?.className}`}
        >
            <div className="w-full flex items-center justify-start gap-2">
                <div className="relative">
                    <UserProfilePicture
                        customContainerClass={`flex justify-center items-center h-[50px] w-[50px] min-h-[50px] min-w-[50px] rounded-full overflow-hidden border-white border-solid border-[3px] text-white font-medium text-xl`}
                        customImageClass={`flex justify-center items-center h-[50px] w-[50px] min-h-[50px] min-w-[50px] rounded-full overflow-hidden object-cover border-white border-solid border-2`}
                        customSize={120}
                        user={contract?.owner}
                    />
                </div>
                <div className="flex flex-col text-left">
                    <p className="text-grayscale-900 text-sm">
                        <span className="font-semibold">{contract?.owner?.displayName}</span> has
                        requested to view{' '}
                        <span className="font-semibold">{currentLCNUser?.displayName}</span>'s
                        insights.
                    </p>
                </div>
            </div>

            <div className="flex items-center flex-col justify-center w-full">
                <div className="w-full flex flex-col items-start justify-center gap-2">
                    {isChild ? (
                        <button
                            className={`cursor-pointer notification-claim-btn flex items-center w-full justify-center flex-1 rounded-[24px] font-semibold font-poppins py-2 px-3 tracking-wide bg-indigo-500 text-white`}
                            onClick={e => {
                                e.stopPropagation();
                                handleGetPermission();
                            }}
                            name="notification-claim-button"
                        >
                            Get Permission
                        </button>
                    ) : (
                        <FullScreenConsentFlow
                            contractDetails={contract}
                            insightsProfile={contract?.owner}
                            isPostConsent={false}
                            isInlineInsightsRequest
                            aiInsightsRequestOptions={options}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiInsightsUserRequestsToast;
