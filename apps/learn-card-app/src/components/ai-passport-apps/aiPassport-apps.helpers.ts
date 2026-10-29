import { getLearnCardAiPassportContractUri, LaunchPadAppListItem } from 'learn-card-base';
import { isProductionNetwork } from 'learn-card-base/helpers/networkHelpers';
import { networkStore } from 'learn-card-base/stores/NetworkStore';

// this is an internal app ranking
// ex:
// category AI Tutor
// rank #1, #2, #3
export enum AiPassportAppRankingEnum {
    gemini = 3,
}

export enum AiPassportAppsEnum {
    gemini = 'gemini',
    learncardapp = 'learnCard',
}

// IOS app store IDs for getting meta data
export enum AiPassportAppStoreIDs {
    gemini = '6477489729',
    learncardapp = '1635841898',
}

// learncardapp resolves per network on read (staging vs production consent contract).
export const AiPassportAppContractUri = {
    gemini: 'lc:network:network.learncard.com/trpc:contract:fa97a6ae-4020-446d-ae63-298bd7c65d85',
    get learncardapp(): string {
        return getLearnCardAiPassportContractUri();
    },
};

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
        get contractUri() {
            return AiPassportAppContractUri.learncardapp;
        },
        privacyPolicyUrl: 'https://openai.com/policies/row-privacy-policy/',
        url: networkStore.get.aiServiceUrl(),
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

export const getSelectableAiPassportApps = (
    allAppsAvailable = areAiPassportAppsAvailable()
): (LaunchPadAppListItem & { url: string })[] =>
    allAppsAvailable
        ? aiPassportApps
        : aiPassportApps.filter(app => app.type === AiPassportAppsEnum.learncardapp);

export const getAiAppBackgroundStylesForApp = (app?: LaunchPadAppListItem) => {
    if (app?.type === AiPassportAppsEnum.gemini) {
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
