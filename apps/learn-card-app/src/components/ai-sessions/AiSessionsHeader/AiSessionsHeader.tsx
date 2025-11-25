import React from 'react';
import { useHistory } from 'react-router-dom';

import { IonSpinner } from '@ionic/react';
import SlimCaretLeft from '../../svgs/SlimCaretLeft';
import AiSessionsHeaderSkeleton from './AiSessionsHeaderSkeleton';
import AiSessionsDesktopHeader from './AiSessionsDesktopHeader';
import AiPassportPersonalizationContainer from '../../ai-passport/AiPassportPersonalizationContainer';
import UnicornIcon from 'learn-card-base/svgs/UnicornIcon';

import { pluralize, useDeviceTypeByWidth, useModal, ModalTypes } from 'learn-card-base';

import { getAiPassportAppByContractUri } from '../../ai-passport-apps/aiPassport-apps.helpers';
import { VC } from '@learncard/types';

export const AiSessionsSubHeader: React.FC<{
    isLoading: boolean;
    sessions?: VC[];
    appContractUri: string;
    topicTitle: string;
    handleGoBack?: () => void;
}> = ({ isLoading, sessions, appContractUri, topicTitle, handleGoBack }) => {
    const history = useHistory();
    const sessionsCount = sessions?.length ?? 0;
    const { newModal } = useModal();

    const { isMobile, isDesktop } = useDeviceTypeByWidth();

    const app = getAiPassportAppByContractUri(appContractUri);

    const handlePersonalizeMyAi = () => {
        newModal(
            <AiPassportPersonalizationContainer />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    if (isDesktop) {
        if (isLoading) {
            return (
                <div className="w-full flex items-center justify-start mt-4">
                    <button
                        onClick={() => {
                            if (handleGoBack) return handleGoBack();

                            history.push('/ai/topics');
                        }}
                        className="text-grayscale-50 p-0 mr-[10px]"
                    >
                        <SlimCaretLeft className="text-grayscale-600 shrink-0" />
                    </button>
                    <div className="w-full flex flex-col gap-2 animate-pulse">
                        <div className="h-[25px] w-[200px] bg-grayscale-200 rounded-md" />
                        <div className="h-[17px] w-[150px] bg-grayscale-100 rounded-md" />
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full flex items-center justify-start">
                <button
                    onClick={() => {
                        if (handleGoBack) return handleGoBack();

                        history.push('/ai/topics');
                    }}
                    className="text-grayscale-50 p-0 mr-[10px]"
                >
                    <SlimCaretLeft className="text-grayscale-600 shrink-0" />
                </button>
                <div className="w-full flex flex-col items-start justify-center">
                    <h2 className="line-clamp-1 text-grayscale-900 text-[25px] font-semibold capitalize">
                        {topicTitle}
                    </h2>
                    <p className="text-grayscale-500 font-semibold text-[17px] flex items-center">
                        <span className="mr-1 font-semibold text-grayscale-900">{app?.name}</span>•{' '}
                        {sessionsCount} {pluralize('Session', sessionsCount)}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex items-center justify-between pt-[4px]">
            <h2 className="text-grayscale-500 font-semibold text-[25px] flex items-center">
                {isLoading ? (
                    <IonSpinner name="crescent" color="dark" className="scale-[1] mr-1" />
                ) : (
                    sessionsCount
                )}
                &nbsp;{pluralize('Session', sessionsCount)}
            </h2>
            {isMobile && (
                <button
                    onClick={handlePersonalizeMyAi}
                    className="bg-white text-grayscale-700 flex items-center justify-center p-3 py-[5px] rounded-[15px] font-semibold text-[14px] mr-4 border-[1px] border-solid border-grayscale-200"
                >
                    <UnicornIcon className="w-[35px] h-auto mr-2" />
                    Personalize
                </button>
            )}
        </div>
    );
};

export const AiSessionsHeader: React.FC<{
    topicTitle: string;
    appContractUri: string;
    isLoading: boolean;
    handleGoBack?: () => void;
}> = ({ topicTitle, appContractUri, isLoading, handleGoBack }) => {
    const history = useHistory();
    const { isDesktop } = useDeviceTypeByWidth();

    const app = getAiPassportAppByContractUri(appContractUri);

    if (isDesktop) {
        return <AiSessionsDesktopHeader app={app} />;
    }

    if (isLoading) {
        return <AiSessionsHeaderSkeleton />;
    }

    return (
        <div className="flex items-center justify-center ion-padding absolute bg-white/70 backdrop-blur-[5px] w-full top-0 left-0 z-20">
            <div className="w-full flex max-w-[600px]">
                <button
                    onClick={() => {
                        if (handleGoBack) return handleGoBack();

                        history.push('/ai/topics');
                    }}
                    className="text-grayscale-50 p-0 mr-[10px]"
                >
                    <SlimCaretLeft className="text-grayscale-600 shrink-0" />
                </button>
                <div className="h-[75px] w-[75px] min-h-[75px] min-w-[75px] mr-2">
                    <img
                        className="w-full h-full object-cover bg-white rounded-[16px] overflow-hidden border-[1px] border-solid"
                        alt={`${app?.name} logo`}
                        src={app?.img}
                    />
                </div>
                <div className="flex flex-col items-start justify-center ml-1">
                    <h2 className="text-[25px] mobile:text-[18px] font-semibold text-grayscale-900 font-poppins line-clamp-1">
                        {topicTitle}
                    </h2>
                    <p className="text-[17px] mobile:text-[14px] font-poppins text-grayscale-900 font-semibold">
                        {app?.name}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiSessionsHeader;
