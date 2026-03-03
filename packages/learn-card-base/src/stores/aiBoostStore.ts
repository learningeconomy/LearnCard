import { createStore } from '@udecode/zustood';
import { CredentialCategoryEnum } from 'learn-card-base';

export type AIBoostStore = {
    title: string;
    description: string;
    category: CredentialCategoryEnum;
    categoryEnum: CredentialCategoryEnum | string;
    type: string;
    imageUrl: string;
    skills: string[];
    narrative: string;
    backgroundImageUrl: string;
};

export const AIBoostStore = createStore('AIBoostStore')<AIBoostStore>(
    {
        title: '',
        description: '',
        category: CredentialCategoryEnum.achievement,
        categoryEnum: CredentialCategoryEnum.achievement,
        type: '',
        imageUrl: '',
        skills: [],
        narrative: '',
        backgroundImageUrl: '',
    },
    { persist: { name: 'aiBoostStore', enabled: false } }
);

export default AIBoostStore;
