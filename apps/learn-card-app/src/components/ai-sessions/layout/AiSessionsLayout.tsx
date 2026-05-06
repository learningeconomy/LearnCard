import React from 'react';

import { IonFooter } from '@ionic/react';
import UnicornIcon from 'learn-card-base/svgs/UnicornIcon';
import QRCodeScannerButton from '../../qrcode-scanner-button/QRCodeScannerButton';
import AiPassportPersonalizationContainer from '../../ai-passport/AiPassportPersonalizationContainer';
import GenericErrorBoundary from '../../generic/GenericErrorBoundary';

import { useModal, ModalTypes, useDeviceTypeByWidth } from 'learn-card-base';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { NewAiSessionStepEnum } from '../../new-ai-session/newAiSession.helpers';
import NewAiSessionButton, {
    NewAiSessionButtonEnum,
} from '../../new-ai-session/NewAiSessionButton/NewAiSessionButton';

export const AiSessionsLayout: React.FC<{
    leftColumn: React.ReactNode;
    rightColumn: React.ReactNode;
    handleSetChatBotSelected?: (chatBotType: NewAiSessionStepEnum) => void;
    currentTopicHasSessions?: boolean;
    onNewSessionForTopic?: () => void;
}> = ({ leftColumn, rightColumn, currentTopicHasSessions, onNewSessionForTopic }) => {
    const { newModal } = useModal();
    const { isMobile, isDesktop } = useDeviceTypeByWidth();

    const handlePersonalizeMyAi = () => {
        newModal(
            <AiPassportPersonalizationContainer />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    return (
        <div className="h-full w-full relative">
            <div className="flex h-full items-center justify-start relative">
                <div
                    className={` flex flex-col h-full items-center justify-center relative border-r-[1px] border-solid border-grayscale-100 ${
                        isMobile ? 'w-full' : 'min-w-[425px]'
                    }`}
                >
                    <GenericErrorBoundary>{leftColumn}</GenericErrorBoundary>

                    {isDesktop && (
                        <IonFooter className="absolute bottom-0 w-full bg-cyan-50 flex items-center justify-around ion-padding ion-no-border gap-3">
                            <button
                                onClick={handlePersonalizeMyAi}
                                className="flex-1 h-[60px] bg-white text-grayscale-900 flex items-center justify-center px-4 py-2 rounded-[20px] font-semibold text-[17px] shadow-soft-bottom"
                            >
                                <UnicornIcon className="w-[35px] h-auto mr-2" />
                                Personalize My AI
                            </button>
                            {currentTopicHasSessions && onNewSessionForTopic && (
                                <NewAiSessionButton
                                    type={NewAiSessionButtonEnum.mobile}
                                    iconType="light"
                                    text="New Session"
                                    onClick={onNewSessionForTopic}
                                    className="!flex-1 !mt-0 !h-[60px] !px-4 !py-2 !rounded-[20px] !bg-indigo-500 !border-indigo-500 !text-white !text-center !flex !items-center !justify-center !flex-row-reverse"
                                />
                            )}
                        </IonFooter>
                    )}
                </div>

                {isDesktop && (
                    <div className="text-grayscale-900 flex flex-col h-full items-center justify-center relative w-full">
                        <div className="absolute top-[25px] right-[25px] bg-transparent">
                            <QRCodeScannerButton branding={BrandingEnum.learncard} />
                        </div>
                        <GenericErrorBoundary>{rightColumn}</GenericErrorBoundary>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiSessionsLayout;
