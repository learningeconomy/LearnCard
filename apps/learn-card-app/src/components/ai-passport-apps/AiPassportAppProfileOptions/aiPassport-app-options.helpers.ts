import React from 'react';
import InsightLampIcon from 'learn-card-base/svgs/InsightLampIcon';
import PrivacyLock from 'learn-card-base/svgs/PrivacyLock';

export enum AiAppProfileOptionsEnum {
    learningInsights = 'learningInsights',
    personalization = 'personalization',
    appProfile = 'appProfile',
    privacy = 'privacy',
}

export type AiAppProfileOption = {
    id: number;
    title: string;
    Icon: React.ElementType | null;
    type: AiAppProfileOptionsEnum;
};

export const aiAppProfileOptions: AiAppProfileOption[] = [
    // Commented out until supported
    // {
    //     id: 1,
    //     title: 'Learning Insights',
    //     Icon: InsightLampIcon,
    //     type: AiAppProfileOptionsEnum.learningInsights,
    // },
    {
        id: 2,
        title: 'Personalize AI',
        Icon: null,
        type: AiAppProfileOptionsEnum.personalization,
    },
    {
        id: 3,
        title: 'App Profile',
        Icon: null,
        type: AiAppProfileOptionsEnum.appProfile,
    },
    {
        id: 4,
        title: 'Privacy & Data',
        Icon: PrivacyLock,
        type: AiAppProfileOptionsEnum.privacy,
    },
];
