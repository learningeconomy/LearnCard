import { KnownAchievementType } from '@learncard/types';

export type GenericVCInputFields = {
    name: string;
    description: string;
    narrative?: string;
    image?: string;
    achievementType: KnownAchievementType;
    type: string;
};

// NOTE: there's also WALLET_SUBTYPES in @learncard/react
//   all references to that constant outside of @learncard/react have been replaced with this
export enum WalletCategoryTypes {
    achievements = 'achievements',
    accommodations = 'accommodations',
    accomplishments = 'accomplishments',
    learningHistory = 'learningHistory',
    socialBadges = 'socialBadges',
    jobHistory = 'jobHistory',
    skills = 'skills',

    membership = 'membership',
    meritBadges = 'meritBadges',
    families = 'families',

    // AI
    aiSessions = 'aiSessions',
    aiPathways = 'aiPathways',
    aiSummaries = 'aiSummaries',
    aiInsights = 'aiInsights',
    aiTopics = 'aiTopics',
    aiAssessments = 'aiAssessments',

    // todo
    goals = 'goals',
    events = 'events',
    relationships = 'relationships',

    // deprecated
    currencies = 'currency',
    ids = 'ids',

    notImplemented = 'notImplemented',
}
