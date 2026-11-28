import type { ConsentFlowContractRequestStatus } from '@learncard/types';
import React from 'react';

import AiInsightsUserCard from '../../ai-insights/AiInsightsUserCard';

import { AiInsightsUserCardMode } from '../../ai-insights/ai-insights.helpers';
import { LCNProfile } from '@learncard/types';
import { AppHeader, AppToolbar } from 'learn-card-base/ui/chrome';

type LearnerInsightsPreviewHeaderProps = {
    profile: LCNProfile;
    readStatus?: 'unseen' | 'seen' | null | undefined;
    status?: ConsentFlowContractRequestStatus | undefined;
};

const LearnerInsightsPreviewHeader: React.FC<LearnerInsightsPreviewHeaderProps> = ({
    profile,
    readStatus,
    status,
}) => {
    return (
        <AppHeader className="rounded-b-[30px] overflow-hidden shadow-md ">
            <AppToolbar color="light" className="">
                <div className="flex flex-col gap-2 px-2">
                    <AiInsightsUserCard
                        profile={profile}
                        mode={AiInsightsUserCardMode.Preview}
                        containerClassName="shadow-none! pt-4! pb-2!"
                        imageClassName="w-[80px]! h-[80px]! min-w-[80px]! min-h-[80px]!"
                        readStatus={readStatus}
                        status={status}
                        showOptions
                    />
                </div>
            </AppToolbar>
        </AppHeader>
    );
};

export default LearnerInsightsPreviewHeader;
