import React, { useMemo } from 'react';

import { ProfilePicture, useGetEnrichedSession, useDeviceTypeByWidth } from 'learn-card-base';
import { UserChatBotTypingIndicator } from './TypingIndicator';
import ExperimentalFeatureBox from '../../../generic/ExperimentalFeatureBox';
import FormatQuestionTitle from '../../../ai-passport/helpers/FormatQuestionTitle';
import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';
import Pencil from '../../../svgs/Pencil';

import {
    ChatBotQA,
    ChatBotQuestionsEnum,
    existingSessionQAInitState,
    newSessionQAInitState,
} from '../newAiSessionChatbot.helpers';
import {
    aiPassportApps,
    getAiPassportAppByContractUri,
} from '../../../ai-passport-apps/aiPassport-apps.helpers';
import useAppStore from '../../../../pages/launchPad/useAppStore';

export const ChatBotBubbleAnswer: React.FC<{
    qa: ChatBotQA;
    index: number;
    handleEditChatBotAnswer: (indexToEdit: number) => void;
    disableEdit?: boolean;
    className?: string;
}> = ({ qa, index, handleEditChatBotAnswer, disableEdit, className }) => {
    const { isDesktop } = useDeviceTypeByWidth();
    let containerStyles = 'items-start';
    const firstStyles = index === 0 ? '!pt-[30px]' : '';
    const lastStyles =
        index === newSessionQAInitState.length - 1 || index === existingSessionQAInitState.length
            ? '!pb-[30px]'
            : '';
    const animationDelay = `${index * 150}ms`;

    let image = null;
    let app: { name?: string; img?: string } | null | undefined = null;

    // Fetch installed apps to look up app store listings
    const { useInstalledApps } = useAppStore();
    const { data: installedAppsData } = useInstalledApps();

    const { data, isLoading } = useGetEnrichedSession(
        String(qa?.answer || ''),
        qa?.type === ChatBotQuestionsEnum.ResumeTopic && !!qa?.answer
    );

    let answer = useMemo(() => {
        if (qa.type === ChatBotQuestionsEnum.ResumeTopic) {
            return data?.topicVc?.boostCredential?.topicInfo?.title || '';
        }
        return qa.answer;
    }, [qa, data]);

    if (qa.type === ChatBotQuestionsEnum.ResumeTopic) {
        app = getAiPassportAppByContractUri(data?.topicRecord?.contractUri || '');
        image = (
            <div className="h-[80px] w-[80px] rounded-[20px] overflow-hidden mr-2">
                <img
                    className="w-full h-full object-cover bg-white rounded-[20px] overflow-hidden "
                    alt={`${app?.name} logo`}
                    src={app?.img}
                />
            </div>
        );
        containerStyles = 'items-center';
    } else if (qa.type === ChatBotQuestionsEnum.AppSelection) {
        // First try to find in hardcoded apps (numeric id)
        app = aiPassportApps.find(a => a.id === qa.answer);

        // If not found, check installed app store listings (string id)
        if (!app && installedAppsData?.records) {
            const installedApp = installedAppsData.records.find(a => a.listing_id === qa.answer);

            if (installedApp) {
                app = {
                    name: installedApp.display_name,
                    img: installedApp.icon_url,
                };
            }
        }

        answer = app?.name;
        containerStyles = 'items-center';
        image = (
            <div className="h-[80px] w-[80px] rounded-[20px] overflow-hidden mr-2">
                <img
                    className="w-full h-full object-cover bg-white rounded-[20px] overflow-hidden "
                    alt={`${app?.name} logo`}
                    src={app?.img}
                />
            </div>
        );
    }

    if (isLoading) {
        return <UserChatBotTypingIndicator />;
    }

    return (
        <>
            <div
                className={`w-full bg-white flex flex-col items-end justify-center ion-padding ${firstStyles} ${lastStyles} ${className}`}
            >
                {index === 0 && (
                    <div className="w-full flex items-center justify-center">
                        <ExperimentalFeatureBox className="mb-[20px] w-full max-w-[375px]" />
                    </div>
                )}
                <div className="animate-chat-in-mine flex" style={{ animationDelay }}>
                    <div
                        className={`bg-cyan-50 px-[15px] py-[10px] mr-2 flex rounded-[20px] ${containerStyles}`}
                    >
                        {image}
                        <p className="text-grayscale-800 mr-1 font-semibold text-[17px]">
                            {answer}
                        </p>
                        {!disableEdit && isDesktop && index === 0 && (
                            <button
                                onClick={() => {
                                    handleEditChatBotAnswer(index);
                                }}
                            >
                                <Pencil className="text-grayscale-600 h-auto w-[24px]" />
                            </button>
                        )}
                    </div>
                    <ProfilePicture
                        customContainerClass="text-grayscale-900 h-[40px] w-[40px] min-h-[40px] min-w-[40px] max-h-[40px] max-w-[40px] mt-[0px] mb-0"
                        customImageClass="w-full h-full object-cover"
                    />
                </div>
            </div>
        </>
    );
};

export const ChatBotBubbleQuestion: React.FC<{ qa: ChatBotQA; index: number }> = ({
    qa,
    index,
}) => {
    const animationDelay = `${index * 150}ms`;

    return (
        <div className="w-full bg-white flex items-center justify-start ion-padding">
            <div className="animate-chat-in flex items-end" style={{ animationDelay }}>
                <div className="relative flex flex-col items-center justify-center rounded-3xl mr-2 w-[40px] h-[40px]">
                    <SolidCircleIcon className="absolute top-0 w-[40px] h-[40px]" />
                    <BlueMagicWand className="z-50 w-[45px] h-auto" />
                </div>
                <div className="bg-grayscale-100 rounded-[20px] px-[15px] py-[10px] flex items-center">
                    <p className="text-grayscale-800 text-[17px]">
                        <FormatQuestionTitle
                            title={qa?.question as string}
                            phraseToEmphasize={qa?.phraseToEmphasize as string}
                        />
                    </p>
                </div>
            </div>
        </div>
    );
};
