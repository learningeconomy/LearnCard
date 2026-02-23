import { CredentialCategoryEnum } from 'learn-card-base';

export const RESUME_SECTIONS = [
    {
        key: CredentialCategoryEnum.workHistory,
        label: 'Work Experience',
    },
    {
        key: CredentialCategoryEnum.learningHistory,
        label: 'Education & Learning',
    },
    {
        key: CredentialCategoryEnum.achievement,
        label: 'Achievements',
    },
    {
        key: CredentialCategoryEnum.accomplishment,
        label: 'Accomplishments',
    },
    {
        key: CredentialCategoryEnum.skill,
        label: 'Skills',
    },
    {
        key: CredentialCategoryEnum.socialBadge,
        label: 'Badges & Certifications',
    },
] as const;

export type ResumeSectionKey = (typeof RESUME_SECTIONS)[number]['key'];

export type PersonalDetails = {
    name: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
};

export type ResolvedCredentialMeta = {
    title: string;
    issuer: string;
    date: string;
};
