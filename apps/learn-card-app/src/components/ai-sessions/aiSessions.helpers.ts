import { VC } from '@learncard/types';
import { aiPassportApps } from '../ai-passport-apps/aiPassport-apps.helpers';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

export enum AiSessionsTabsEnum {
    learnCard = 'learnCard',
    chatGPT = 'chatGPT',
    claude = 'claude',
    gemini = 'gemini',
    all = 'all',
}

export type AiSessionTab = {
    id: number;
    title: string;
    type: AiSessionsTabsEnum;
};

export const aiSessiontTabs: AiSessionTab[] = [
    {
        id: 1,
        title: 'All',
        type: AiSessionsTabsEnum.all,
    },
    {
        id: 2,
        title: 'LearnCard',
        type: AiSessionsTabsEnum.learnCard,
    },
    {
        id: 3,
        title: 'ChatGPT',
        type: AiSessionsTabsEnum.chatGPT,
    },
    {
        id: 4,
        title: 'Claude',
        type: AiSessionsTabsEnum.claude,
    },
    {
        id: 5,
        title: 'Gemini',
        type: AiSessionsTabsEnum.gemini,
    },
];

export const getAiSessionsApp = (appType: AiSessionsTabsEnum) => {
    return aiPassportApps.find(app => app.type === appType);
};

export const getAiSessionTitle = (_session: VC) => {
    const session = unwrapBoostCredential(_session);
    if (session?.summaryInfo) return session?.summaryInfo?.title;

    return session?.name;
};
