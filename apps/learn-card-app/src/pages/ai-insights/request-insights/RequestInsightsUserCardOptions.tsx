import React from 'react';

import AiInsightsUserCard from '../AiInsightsUserCard';

import { LCNProfile } from '@learncard/types';
import { useModal } from 'learn-card-base';

import {
    requestInsightsOptions,
    RequestInsightStatusEnum,
    RequestInsightsOptionsEnum,
} from './request-insights.helpers';

import { AiInsightsUserCardMode } from '../ai-insights.helpers';

export const RequestInsightsUserCardOptions: React.FC<{
    profile: LCNProfile;
    readStatus?: 'unseen' | 'seen' | null | undefined;
    status?: 'pending' | 'accepted' | 'denied' | null | undefined;
    handleRequestInsights: (mode: AiInsightsUserCardMode) => void;
}> = ({ profile, readStatus, status, handleRequestInsights }) => {
    const { closeModal } = useModal();

    return (
        <div className="flex flex-col gap-2 px-2">
            <AiInsightsUserCard
                profile={profile}
                mode={AiInsightsUserCardMode.View}
                containerClassName="!shadow-none !pt-4 !pb-2"
                imageClassName="!w-[80px] !h-[80px] !min-w-[80px] !min-h-[80px]"
                readStatus={readStatus}
                status={status}
            />
            <div className="flex flex-col gap-2 px-3 pb-4">
                <div className="h-[1px] bg-grayscale-200" />
                {requestInsightsOptions.map(option => {
                    if (
                        status === RequestInsightStatusEnum.accepted &&
                        (option.type === RequestInsightsOptionsEnum.cancelRequest ||
                            option.type === RequestInsightsOptionsEnum.requestReminder)
                    ) {
                        return null;
                    }

                    if (
                        status === 'pending' &&
                        option.type === RequestInsightsOptionsEnum.removeConnection
                    ) {
                        return null;
                    }

                    let onClick = () => {};

                    if (option.type === RequestInsightsOptionsEnum.requestReminder) {
                        onClick = () => {
                            closeModal();
                            handleRequestInsights(AiInsightsUserCardMode.Request);
                        };
                    } else if (option.type === RequestInsightsOptionsEnum.cancelRequest) {
                        onClick = () => {
                            closeModal();
                            handleRequestInsights(AiInsightsUserCardMode.Cancel);
                        };
                    }

                    return (
                        <button
                            key={option.id}
                            className="text-grayscale-900 flex items-center justify-start gap-2 py-2"
                            onClick={onClick}
                        >
                            <option.icon
                                version="thin"
                                className="h-[40px] w-[40px] min-h-[40px] min-w-[40px] text-grayscale-900 text-lg"
                            />
                            {option.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default RequestInsightsUserCardOptions;
