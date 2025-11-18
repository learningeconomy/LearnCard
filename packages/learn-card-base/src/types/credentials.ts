import { AchievementCredential, VC } from '@learncard/types';

export enum CredentialCategoryEnum {
    learningHistory = 'Learning History',
    socialBadge = 'Social Badge',
    achievement = 'Achievement',
    accomplishment = 'Accomplishment',
    skill = 'Skill',
    workHistory = 'Work History',
    relationship = 'Relationship',
    accommodation = 'Accommodation',
    events = 'Events',
    meritBadge = 'Merit Badge',
    troops = 'Membership',
    family = 'Family',

    // todo
    membership = 'Membership',
    goals = 'Goals',

    // deprecated
    id = 'ID',
    currency = 'Currency',

    // troops 2.0 ID categories
    globalAdminId = 'Global Admin ID',
    nationalNetworkAdminId = 'National Network Admin ID',
    troopLeaderId = 'Troop Leader ID',
    scoutId = 'Scout ID',

    // ai passport
    aiSummary = 'AI Summary',
    aiTopic = 'AI Topic',
    aiPathway = 'AI Pathway',
    aiInsight = 'AI Insight',
    aiAssessment = 'AI Assessment',
}

export const CREDENTIAL_CATEGORIES = [
    'Achievement',
    'Skill',
    'ID',
    'Learning History',
    'Work History',
    'Hidden',
    'Social Badge',
    'Membership',
    'Currency',
    'Course',
    'Accomplishment',
    'Accommodation',
    'Relationship',
    'Events',
    'Merit Badge',
    'Social Badge',
    'Family',
    'Experience',

    // troops 2.0 ID categories
    'Global Admin ID',
    'National Network Admin ID',
    'Troop Leader ID',
    'Scout ID',

    // AI Passport Categories
    'AI Summary',
    'AI Topic',
    'AI Assessment',
    'AI Pathway',
    'AI Insight',
] as const;

export type CredentialCategory = (typeof CREDENTIAL_CATEGORIES)[number];

export type IndexMetadata = {
    category: CredentialCategory;
    courseId?: string;
    title?: string;
    imgUrl?: string;
};

export type CourseMetaVC = VC & {
    credentialSubject: {
        potentialVCs: { type: ['PotentialVC']; kind: string; name: string }[];
    };
};

export type EntryVC = AchievementCredential & {
    id: string;
    credentialSubject: {
        activityStartDate?: string;
        activityEndDate?: string;
        achievement: {
            id: string;
            description: string;
            alignment: [
                { type: ['Alignment']; targetName: string; targetUrl: string; targetCode: string }
            ];
        };
    };
};
