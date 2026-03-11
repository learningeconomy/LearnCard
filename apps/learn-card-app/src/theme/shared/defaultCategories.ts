import { CredentialCategoryEnum } from 'learn-card-base';

import type { ThemeCategory } from '../validators/theme.validators';

/**
 * Default credential category labels shared across all themes.
 * Themes can override individual categories or use a completely custom list.
 */
export const DEFAULT_CATEGORIES: ThemeCategory[] = [
    {
        labels: { singular: 'AI Session', plural: 'AI Sessions' },
        categoryId: CredentialCategoryEnum.aiTopic,
    },
    {
        labels: { singular: 'AI Pathway', plural: 'AI Pathways' },
        categoryId: CredentialCategoryEnum.aiPathway,
    },
    {
        labels: { singular: 'AI Insight Hub', plural: 'AI Insights Hub' },
        categoryId: CredentialCategoryEnum.aiInsight,
    },
    {
        labels: { singular: 'Skill', plural: 'Skills Hub' },
        categoryId: CredentialCategoryEnum.skill,
    },
    {
        labels: { singular: 'Boost', plural: 'Boosts' },
        categoryId: CredentialCategoryEnum.socialBadge,
    },
    {
        labels: { singular: 'Achievement', plural: 'Achievements' },
        categoryId: CredentialCategoryEnum.achievement,
    },
    {
        labels: { singular: 'Study', plural: 'Studies' },
        categoryId: CredentialCategoryEnum.learningHistory,
    },
    {
        labels: { singular: 'Portfolio', plural: 'Portfolio' },
        categoryId: CredentialCategoryEnum.accomplishment,
    },
    {
        labels: { singular: 'Assistance', plural: 'Assistance' },
        categoryId: CredentialCategoryEnum.accommodation,
    },
    {
        labels: { singular: 'Experience', plural: 'Experiences' },
        categoryId: CredentialCategoryEnum.workHistory,
    },
    {
        labels: { singular: 'Family', plural: 'Families' },
        categoryId: CredentialCategoryEnum.family,
    },
    {
        labels: { singular: 'ID', plural: 'IDs' },
        categoryId: CredentialCategoryEnum.id,
    },
];
