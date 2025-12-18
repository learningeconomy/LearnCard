import React from 'react';

import RevisitIcon from 'learn-card-base/svgs/RevisitIcon';
import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';
import ExperimentalFeatureBox from '../../generic/ExperimentalFeatureBox';

import { NewAiSessionStepEnum } from '../newAiSession.helpers';

import { useHistory } from 'react-router-dom';
import {
    useDeviceTypeByWidth,
    useModal,
    LaunchPadAppListItem,
    useGetAllAiTopicCredentials,
} from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

export const AiSessionTypeSelector: React.FC<{
    setActiveStep: (step: NewAiSessionStepEnum) => void;
    shortCircuitStepDesktop?: boolean;
    selectedApp?: LaunchPadAppListItem;
}> = ({ setActiveStep, shortCircuitStepDesktop, selectedApp }) => {
    const { closeAllModals } = useModal();
    const history = useHistory();
    const { isDesktop } = useDeviceTypeByWidth();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const selectedAppId = selectedApp?.id || null;

    // if a selected app has been passed in, fetch all ai topics for that app
    // this will determine whether to enable the revisit button
    const { data: aiTopics, isLoading: aiTopicsLoading } = useGetAllAiTopicCredentials(
        selectedApp?.id ? true : false
    );
    const selectedAppAiTopics = aiTopics?.filter(
        (topic: any) => topic?.contractUri === selectedApp?.contractUri
    );
    const disableRevisitButton = selectedApp ? selectedAppAiTopics?.length === 0 : false; // if app is selected, disable if no topics for that app

    return (
        <div className="w-full flex flex-col gap-[20px] items-center justify-center bg-white ion-padding !py-[30px] px-[20px]">
            <ExperimentalFeatureBox className="mb-[10px] max-w-[375px]" />
            <button
                className={`bg-${primaryColor} text-xl text-white flex items-center justify-center font-semibold py-[12px] rounded-full w-full shadow-soft-bottom max-w-[375px]`}
                onClick={() => {
                    if (isDesktop && shortCircuitStepDesktop) {
                        closeAllModals();
                        history.push(
                            `/ai/topics?shortCircuitStep=${NewAiSessionStepEnum.newTopic}&selectedAppId=${selectedAppId}`
                        );
                        return;
                    }
                    setActiveStep(NewAiSessionStepEnum.newTopic);
                }}
            >
                New Topic
                <NewAiSessionIcon className="ml-1" />
            </button>
            <button
                disabled={disableRevisitButton}
                className={`bg-${primaryColor} text-xl text-white flex items-center justify-center font-semibold py-[12px] rounded-full w-full shadow-soft-bottom max-w-[375px] ${
                    disableRevisitButton ? 'cursor-not-allowed opacity-50' : ''
                }`}
                onClick={() => {
                    if (isDesktop && shortCircuitStepDesktop) {
                        closeAllModals();
                        history.push(
                            `/ai/topics?shortCircuitStep=${NewAiSessionStepEnum.revisitTopic}&selectedAppId=${selectedAppId}`
                        );
                        return;
                    }
                    setActiveStep(NewAiSessionStepEnum.revisitTopic);
                }}
            >
                Revisit Topic
                <RevisitIcon version="2" className="ml-1 h-auto w-[31px] text-white" />
            </button>
        </div>
    );
};

export default AiSessionTypeSelector;
