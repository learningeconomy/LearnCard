import React from 'react';

import { useConsentFlowByUri } from 'apps/learn-card-app/src/pages/consentFlow/useConsentFlow';

import {
    LaunchPadAppListItem,
    ToastTypeEnum,
    useConsentToContract,
    useContract,
    useCurrentUser,
    useToast,
} from 'learn-card-base';

import {
    AiPassportAppsEnum,
    aiPassportApps,
    areAiPassportAppsAvailable,
} from '../../../ai-passport-apps/aiPassport-apps.helpers';
import { ChatBotQuestionsEnum } from '../newAiSessionChatbot.helpers';
import { getMinimumTermsForContract } from 'apps/learn-card-app/src/helpers/contract.helpers';

export const ChatBotAppListItem: React.FC<{
    app: LaunchPadAppListItem;
    index: number;
    handleChatBotAnswer: (
        question: ChatBotQuestionsEnum,
        answer: string,
        currentIndex: number
    ) => void;
}> = ({ app, index, handleChatBotAnswer }) => {
    const currentUser = useCurrentUser()!!!!!!!!!;
    const { presentToast } = useToast();
    const aiAppsAvailable = areAiPassportAppsAvailable();
    const contractUri = aiAppsAvailable ? app.contractUri : undefined;

    const { data: contract } = useContract(contractUri);
    const { hasConsented } = useConsentFlowByUri(contractUri);
    const { mutateAsync: consentToContract } = useConsentToContract(
        app.contractUri ?? '',
        contract?.owner?.did ?? ''
    );

    const isLearnCardAI = app.type === AiPassportAppsEnum.learncardapp;

    if (!aiAppsAvailable) return null;

    // Always show LearnCard AI
    if (!hasConsented && !isLearnCardAI) return null;

    return (
        <button
            key={index}
            role="button"
            onClick={async () => {
                if (isLearnCardAI && !hasConsented && app.contractUri && contract?.owner?.did) {
                    // Consent to LearnCard AI contract if not already connected
                    try {
                        await consentToContract({
                            terms: getMinimumTermsForContract(contract?.contract, currentUser),
                            expiresAt: '',
                            oneTime: false,
                        });
                    } catch (error) {
                        console.error('Failed to consent to LearnCard AI contract:', error);

                        const message =
                            error instanceof Error ? error.message : String(error);

                        presentToast(
                            `Failed to consent to LearnCard AI contract: ${message}`,
                            {
                                type: ToastTypeEnum.Error,
                                hasDismissButton: true,
                            }
                        );
                    }
                }

                handleChatBotAnswer(ChatBotQuestionsEnum.AppSelection, String(app.id), index);
            }}
            className="flex flex-col items-center justify-center"
        >
            <div className="h-[100px] w-[100px] rounded-[20px] overflow-hidden">
                <img
                    className="w-full h-full object-cover bg-white rounded-[20px] overflow-hidden "
                    alt={`${app?.name} logo`}
                    src={app.img}
                />
            </div>

            <p className="text-grayscale-900 text-[15px] font-notoSans font-semibold mt-1">
                {app?.name}
            </p>
        </button>
    );
};

export const ChatBotAppList: React.FC<{
    handleChatBotAnswer: (
        question: ChatBotQuestionsEnum,
        answer: string,
        currentIndex: number
    ) => void;
}> = ({ handleChatBotAnswer }) => {
    const aiAppsAvailable = areAiPassportAppsAvailable();
    const apps = aiAppsAvailable ? aiPassportApps : [];

    return (
        <div className="w-full flex items-center justify-around bg-white py-[24px] px-[20px] gap-[20px] overflow-x-auto">
            {apps.map((app, index) => (
                <ChatBotAppListItem
                    key={index}
                    app={app}
                    index={index}
                    handleChatBotAnswer={handleChatBotAnswer}
                />
            ))}
        </div>
    );
};

export default ChatBotAppList;
