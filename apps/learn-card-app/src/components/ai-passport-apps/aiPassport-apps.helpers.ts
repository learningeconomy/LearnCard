import ChatGPTAppBG from '../../assets/images/chatGpt-app-bg.png';

import { LaunchPadAppListItem } from 'learn-card-base';
import { isProductionNetwork } from 'learn-card-base/helpers/networkHelpers';
import { LEARNCARD_NETWORK_URL, LEARNCARD_AI_URL } from 'learn-card-base/constants/Networks';
import { networkStore } from 'learn-card-base/stores/NetworkStore';

// this is an internal app ranking
// ex:
// category AI Tutor
// rank #1, #2, #3
export enum AiPassportAppRankingEnum {
    chatGPT = 1,
    claude = 2,
    gemini = 3,
}

export enum AiPassportAppsEnum {
    chatGPT = 'chatGPT',
    claude = 'claude',
    gemini = 'gemini',
    learncardapp = 'learnCard',
}

// IOS app store IDs for getting meta data
export enum AiPassportAppStoreIDs {
    chatGPT = '6448311069',
    claude = '6473753684',
    gemini = '6477489729',
    learncardapp = '1635841898',
}

export enum AiPassportAppContractUri {
    chatGPT = 'lc:network:network.learncard.com/trpc:contract:469524d4-264c-4fc3-99e4-0c9f06c805e8',
    claude = 'lc:network:network.learncard.com/trpc:contract:5d5447fc-9197-45ac-859a-5f068ff12938',
    gemini = 'lc:network:network.learncard.com/trpc:contract:fa97a6ae-4020-446d-ae63-298bd7c65d85',
    learncardapp = 'lc:network:network.learncard.com/trpc:contract:2ed7b889-c06e-47c4-835b-d924c17e9891',
}

/** @deprecated Use `isProductionNetwork` from `learn-card-base/helpers/networkHelpers` instead. */
export const areAiPassportAppsAvailable = (): boolean => isProductionNetwork();

export const aiPassportApps: (LaunchPadAppListItem & { url: string })[] = [
    {
        id: 1,
        name: 'LearnCard AI',
        description: 'AI Tutoring by Learning Economy',
        img: 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb',
        isConnected: false,
        displayInLaunchPad: true,
        handleConnect: () => {},
        handleView: () => {},
        type: AiPassportAppsEnum.learncardapp,
        appStoreID: AiPassportAppStoreIDs.learncardapp,
        contractUri: AiPassportAppContractUri.learncardapp,
        privacyPolicyUrl: 'https://openai.com/policies/row-privacy-policy/',
        url: LEARNCARD_AI_URL,
    },
    {
        id: 2,
        name: 'ChatGPT',
        /* description:
                'is an artificial intelligence (AI) chatbot that uses natural language processing to create humanlike conversational dialogue. The language model can respond to questions and compose various written content, including articles, social media posts, essays, code and emails.', */
        description: 'AI Tutoring by OpenAI',
        img: 'https://cdn.filestackcontent.com/lO9sxSZS4Gr2iBjZ8ey5',
        isConnected: false,
        displayInLaunchPad: false,
        handleConnect: () => {},
        handleView: () => {},
        type: AiPassportAppsEnum.chatGPT,
        appStoreID: AiPassportAppStoreIDs.chatGPT,
        contractUri: AiPassportAppContractUri.chatGPT,
        privacyPolicyUrl: 'https://openai.com/policies/row-privacy-policy/',
        url: 'https://gpt.learncard.ai',
    },
    {
        id: 3,
        name: 'Claude',
        /* description: `is an intelligent learning and skills assessment tool that helps users expand their knowledge through interactive lessons, personalized feedback, and adaptive quizzes.
    Through session assessments, it evaluates proficiency and generates credentials, providing verifiable proof of skills and knowledge mastery.`, */
        description: 'AI Tutoring by Anthropic',
        img: 'https://cdn.filestackcontent.com/EN4xPGrUTvCq5P62TrPI',
        isConnected: false,
        displayInLaunchPad: false,
        handleConnect: () => {},
        handleView: () => {},
        type: AiPassportAppsEnum.claude,
        appStoreID: AiPassportAppStoreIDs.claude,
        contractUri: AiPassportAppContractUri.claude,
        privacyPolicyUrl: 'https://www.anthropic.com/legal/privacy',
        url: 'https://claude.learncard.ai',
    },
    {
        id: 4,
        name: 'Gemini',
        // description: `formerly known as Google Bard, is an advanced AI-powered chatbot developed by Google. Designed to generate human-like responses, Gemini can process and respond to text, image, and audio prompts. It’s capable of answering questions, generating written content, creating code, producing images, and handling a wide range of user requests. Gemini is integrated with Google’s suite of applications and services, providing users with convenient access to data from these tools`,
        description: 'AI Tutoring by Google',
        img: 'https://cdn.filestackcontent.com/wb1CmADZRMI6xgKvfvpw',
        isConnected: false,
        displayInLaunchPad: true,
        comingSoon: true,
        handleConnect: () => {},
        handleView: () => {},
        type: AiPassportAppsEnum.gemini,
        appStoreID: AiPassportAppStoreIDs.gemini,
        contractUri: AiPassportAppContractUri.gemini,
        privacyPolicyUrl: 'https://www.gemini.com/legal/privacy-policy',
        url: 'https://gemini.learncard.ai',
    },
];

export const getAiAppBackgroundStylesForApp = (app?: LaunchPadAppListItem) => {
    if (app?.type === AiPassportAppsEnum.chatGPT) {
        return {
            backgroundImage: `url(${ChatGPTAppBG})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
        };
    } else if (app?.type === AiPassportAppsEnum.claude) {
        return {
            backgroundColor: '#DEAD9C',
        };
    } else if (app?.type === AiPassportAppsEnum.gemini) {
        return {
            backgroundColor: '#000000',
        };
    } else if (app?.type === AiPassportAppsEnum.learncardapp) {
        return {
            backgroundColor: '#00BA88',
        };
    }
};

export const getAiPassportAppByContractUri = (contractUri?: string) => {
    const aiPassportApp = aiPassportApps.find(app => app.contractUri === contractUri);
    return aiPassportApp;
};
