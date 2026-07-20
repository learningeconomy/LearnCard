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
        labels: { singular: 'Pathway', plural: 'Pathways' },
        categoryId: CredentialCategoryEnum.aiPathway,
    },
    {
        labels: { singular: 'Insight', plural: 'Insights' },
        categoryId: CredentialCategoryEnum.aiInsight,
    },
    {
        labels: { singular: 'Skill', plural: 'Skills Hub' },
        categoryId: CredentialCategoryEnum.skill,
    },
    {
        labels: { singular: 'Badge', plural: 'Badges' },
        categoryId: CredentialCategoryEnum.socialBadge,
    },
    {
        labels: { singular: 'Achievement', plural: 'Achievements' },
        categoryId: CredentialCategoryEnum.achievement,
    },
    {
        labels: { singular: 'Course', plural: 'Courses' },
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
