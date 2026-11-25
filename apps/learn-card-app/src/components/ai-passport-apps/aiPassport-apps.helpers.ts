import { getLearnCardAiPassportContractUri, LaunchPadAppListItem } from 'learn-card-base';
import { isProductionNetwork } from 'learn-card-base/helpers/networkHelpers';
import { networkStore } from 'learn-card-base/stores/NetworkStore';

// this is an internal app ranking
// ex:
// category AI Tutor
// rank #1, #2, #3
export enum AiPassportAppRankingEnum {}

export enum AiPassportAppsEnum {
    learncardapp = 'learnCard',
}

// IOS app store IDs for getting meta data
export enum AiPassportAppStoreIDs {
    learncardapp = '1635841898',
}

// learncardapp resolves per network on read (staging vs production consent contract).
export const AiPassportAppContractUri = {
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
];

export const getSelectableAiPassportApps = (
    allAppsAvailable = areAiPassportAppsAvailable()
): (LaunchPadAppListItem & { url: string })[] =>
    allAppsAvailable
        ? aiPassportApps
        : aiPassportApps.filter(app => app.type === AiPassportAppsEnum.learncardapp);

export const getAiAppBackgroundStylesForApp = (app?: LaunchPadAppListItem) => {
    if (app?.type === AiPassportAppsEnum.learncardapp) {
        return {
            backgroundColor: '#00BA88',
        };
    }
};

export const getAiPassportAppByContractUri = (contractUri?: string) => {
    const aiPassportApp = aiPassportApps.find(app => app.contractUri === contractUri);
    return aiPassportApp;
};
