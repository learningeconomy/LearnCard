import React, { useEffect, useState } from 'react';

import ExistingAiSessionChatBotContainer from './NewAiSessionChatBot/ExistingAiSessionChatBotContainer';
import NewAiAppSessionChatBotContainer from './NewAiSessionChatBot/NewAiAppSessionChatBotContainer';
import NewAiSessionChatBotContainer from './NewAiSessionChatBot/NewAiSessionChatBotContainer';
import AiSessionTypeSelector from './AiSessionTypeSelector/AiSessionTypeSelector';
import NewAiSessionFooter from './NewAiSessionFooter/NewAiSessionFooter';

import { useDeviceTypeByWidth, LaunchPadAppListItem } from 'learn-card-base';

import { chatBotStore } from '../../stores/chatBotStore';

import { NewAiSessionStepEnum } from './newAiSession.helpers';
import { VC } from '@learncard/types';

export const NewAiSessionContainer: React.FC<{
    existingTopics?: VC[];
    showAiAppSelector?: boolean;
    shortCircuitStep?: NewAiSessionStepEnum | null;
    shortCircuitStepDesktop?: boolean;
    selectedApp?: LaunchPadAppListItem;
    handleStartOver?: () => void;
    disableEdit?: boolean;
}> = ({
    existingTopics,
    showAiAppSelector,
    shortCircuitStep,
    shortCircuitStepDesktop,
    handleStartOver,
    selectedApp,
    disableEdit,
}) => {
    const { isDesktop, isMobile } = useDeviceTypeByWidth();

    const activeStep = chatBotStore.useTracked.activeStep();
    const setActiveStep = chatBotStore.set.setActiveStep;

    // const [activeStep, setActiveStep] = useState<NewAiSessionStepEnum>(
    //     NewAiSessionStepEnum.topicSelector
    // );

    const startInternalAiChatBot = chatBotStore.useTracked.startInternalAiChatBot();
    const setStartInternalAiChatBot = chatBotStore.set.setStartInternalAiChatBot;
    // const [startInternalAiChatBot, setStartInternalAiChatBot] = useState<boolean>(false);

    useEffect(() => {
        if (shortCircuitStep) {
            setActiveStep(shortCircuitStep);
            return;
        }
        if (showAiAppSelector) {
            setActiveStep(NewAiSessionStepEnum.aiAppSelector);
            return;
        } else if (!showAiAppSelector && !existingTopics?.length) {
            setActiveStep(NewAiSessionStepEnum.newTopic);
            return;
        } else {
            setActiveStep(NewAiSessionStepEnum.topicSelector);
            return;
        }
    }, [showAiAppSelector, existingTopics, shortCircuitStep]);

    let step = null;

    switch (activeStep) {
        case NewAiSessionStepEnum.aiAppSelector:
            step = <NewAiAppSessionChatBotContainer />;
            break;
        case NewAiSessionStepEnum.topicSelector: // type of session
            step = (
                <AiSessionTypeSelector
                    setActiveStep={setActiveStep}
                    shortCircuitStepDesktop={shortCircuitStepDesktop}
                    selectedApp={selectedApp}
                />
            );
            break;
        case NewAiSessionStepEnum.newTopic:
            step = (
                <NewAiSessionChatBotContainer
                    handleStartOver={handleStartOver}
                    setActiveStep={setActiveStep}
                    disableEdit={disableEdit}
                    startInternalAiChatBot={startInternalAiChatBot}
                    setStartInternalAiChatBot={setStartInternalAiChatBot}
                    selectedApp={selectedApp}
                />
            );
            break;
        case NewAiSessionStepEnum.revisitTopic:
            step = (
                <ExistingAiSessionChatBotContainer
                    handleStartOver={handleStartOver}
                    setActiveStep={setActiveStep}
                    selectedApp={selectedApp}
                />
            );
            break;
        default:
            step = (
                <AiSessionTypeSelector
                    setActiveStep={setActiveStep}
                    shortCircuitStepDesktop={shortCircuitStepDesktop}
                    selectedApp={selectedApp}
                />
            );
            break;
    }

    const containerStyles = isDesktop ? 'w-full pb-[50px]' : 'w-full';

    return (
        <div
            className={`h-full bg-transparent relative flex items-center flex-col justify-end ${containerStyles}`}
        >
            {step}
            {isMobile && !startInternalAiChatBot && <NewAiSessionFooter />}
        </div>
    );
};

export default NewAiSessionContainer;
