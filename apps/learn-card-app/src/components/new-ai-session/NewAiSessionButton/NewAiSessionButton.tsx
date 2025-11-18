import React from 'react';

import NewAiSessionContainer from '../NewAiSessionContainer';
import NewAiSessionSideMenuButton from './NewAiSessionSideMenuButton';
import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';
import NewAiSessionNavbarButton from './NewAiSessionNavbarButton';
import RevisitIcon from 'learn-card-base/svgs/RevisitIcon';

import { aiPassportApps } from '../../ai-passport-apps/aiPassport-apps.helpers';

import { ModalTypes, useGetCredentialList } from 'learn-card-base';
import useLCNGatedAction from '../../network-prompts/hooks/useLCNGatedAction';
import { useModal } from 'learn-card-base';
import { NewAiSessionStepEnum } from '../newAiSession.helpers';
import { useHasConsentedToAiApp } from 'apps/learn-card-app/src/hooks/useAiSession';
import { useDeviceTypeByWidth } from 'learn-card-base';
import { LaunchPadAppListItem } from 'learn-card-base';

import { chatBotStore } from '../../../stores/chatBotStore';

import useTheme from '../../../theme/hooks/useTheme';

export enum NewAiSessionButtonEnum {
    sideMenu,
    bottomNav,
    start,
    revisit,
    default,
    mini,
    mobile,
}

export const NewAiSessionButton: React.FC<{
    type: NewAiSessionButtonEnum;
    shortCircuitStep?: NewAiSessionStepEnum;
    selectedApp?: LaunchPadAppListItem;
    text?: string;
    onClick?: () => void;
}> = ({ type, shortCircuitStep, selectedApp, onClick }) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const { isDesktop } = useDeviceTypeByWidth();
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });
    const { gate } = useLCNGatedAction();

    const { hasConsentedToAiApps } = useHasConsentedToAiApp();

    const { data: topics, isLoading: topicsLoading } = useGetCredentialList('AI Topic');
    const existingTopics = topics?.pages?.[0]?.records || [];

    // const chatBotSelected = chatBotStore.useTracked.chatBotSelected();

    const handleNewSession = async (
        showAiAppSelector?: boolean,
        chatBotSelectedType?: NewAiSessionStepEnum
    ) => {
        const { prompted } = await gate();
        if (prompted) return;

        // Reset the chatbot store when opening a new session
        chatBotStore.set.resetStore();

        // ! This keeps the state of the chatbot selected in sync with the desktop
        if (chatBotSelectedType) {
            chatBotStore.set.chatBotSelected(chatBotSelectedType);
        }
        const chatBotSelected = chatBotStore.get.chatBotSelected();

        newModal(
            <NewAiSessionContainer
                existingTopics={existingTopics}
                showAiAppSelector={showAiAppSelector}
                shortCircuitStep={shortCircuitStep || chatBotSelected}
                shortCircuitStepDesktop={isDesktop}
                selectedApp={selectedApp}
            />,
            {
                hideButton: true,
            },
            {
                mobile: ModalTypes.Right,
                desktop: ModalTypes.Right,
            }
        );
    };

    if (type === NewAiSessionButtonEnum.sideMenu) {
        return (
            <NewAiSessionSideMenuButton
                handleNewSession={() => handleNewSession(!hasConsentedToAiApps)}
            />
        );
    } else if (type === NewAiSessionButtonEnum.bottomNav) {
        return (
            <NewAiSessionNavbarButton
                handleNewSession={() => handleNewSession(!hasConsentedToAiApps)}
            />
        );
    } else if (type === NewAiSessionButtonEnum.start) {
        return (
            <button
                onClick={
                    onClick
                        ? async () => {
                              const { prompted } = await gate();
                              if (prompted) return;
                              onClick();
                          }
                        : () => handleNewSession(false, NewAiSessionStepEnum.newTopic)
                }
                className={`bg-${primaryColor} text-xl text-white flex items-center justify-center font-semibold py-[12px] rounded-full w-full shadow-soft-bottom max-w-[375px] mr-2`}
            >
                Start
                <NewAiSessionIcon className="ml-1" />
            </button>
        );
    } else if (type === NewAiSessionButtonEnum.revisit) {
        return (
            <button
                onClick={
                    onClick
                        ? async () => {
                              const { prompted } = await gate();
                              if (prompted) return;
                              onClick();
                          }
                        : () => handleNewSession(false, NewAiSessionStepEnum.revisitTopic)
                }
                disabled={!hasConsentedToAiApps || existingTopics.length === 0}
                className={`bg-white text-xl text-${primaryColor} flex items-center justify-center font-semibold py-[12px] rounded-full w-full shadow-soft-bottom max-w-[375px] border-[2px] border-solid border-${primaryColor} ${
                    !hasConsentedToAiApps || existingTopics.length === 0
                        ? 'cursor-not-allowed opacity-50'
                        : ''
                }`}
            >
                Revisit Topic
                <RevisitIcon version="2" className={`ml-1 h-auto w-[31px] text-${primaryColor}`} />
            </button>
        );
    } else if (type === NewAiSessionButtonEnum.mini) {
        return (
            <button
                onClick={
                    onClick
                        ? async () => {
                              const { prompted } = await gate();
                              if (prompted) return;
                              onClick();
                          }
                        : () => handleNewSession()
                }
                className="bg-white text-grayscale-900 flex items-center justify-center p-4 py-2 rounded-[20px] shadow-soft-bottom"
            >
                <NewAiSessionIcon version="2" className="text-grayscale-900 w-[35px] h-auto" />
            </button>
        );
    } else if (type === NewAiSessionButtonEnum.mobile) {
        return (
            <button
                onClick={
                    onClick
                        ? async () => {
                              const { prompted } = await gate();
                              if (prompted) return;
                              onClick();
                          }
                        : () => handleNewSession(undefined, NewAiSessionStepEnum.newTopic)
                }
                className="text-[17px] font-semibold font-notoSans text-blue-950 leading-6 rounded-[15px] border-[1px] border-solid border-grayscale-200 p-[10px] w-full max-w-[95%] flex items-center justify-between pl-[20px] mt-[10px] "
            >
                New Topic
                <NewAiSessionIcon version="3" />
            </button>
        );
    }

    return (
        <button
            onClick={() => handleNewSession()}
            className={`bg-${primaryColor} py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center`}
        >
            New <NewAiSessionIcon />
        </button>
    );
};

export default NewAiSessionButton;

