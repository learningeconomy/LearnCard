import { KnownAchievementType } from '@learncard/types';

export type GenericVCInputFields = {
    name: string;
    description: string;
    narrative?: string;
    image?: string;
    achievementType: KnownAchievementType;
    type: string;
};

export enum WalletCategoryTypes {
    achievements = "achievements",
    ids = "ids",
    jobHistory = "jobHistory",
    currency = "currency",
    learningHistory = "learningHistory",
    skills = "skills"
}
