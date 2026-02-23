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

export type ResumeUserInfo = {
    key: keyof PersonalDetails;
    label: string;
    placeholder: string;
    multiline?: boolean;
};

export type ResolvedCredentialMeta = {
    title: string;
    issuer: string;
    date: string;
};

export type ResumeFieldSource = 'vc' | 'selfAttested';

export type ResumeField = {
    value: string;
    source: ResumeFieldSource;
};

export type ResumeSelfAttestedFields = {
    description?: ResumeField;
    additionalDetails: ResumeField[];
};

export const resumeUserInfo: ResumeUserInfo[] = [
    { key: 'name', label: 'Full Name', placeholder: 'Jane Doe' },
    { key: 'email', label: 'Email', placeholder: 'jane@example.com' },
    { key: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000' },
    { key: 'location', label: 'Location', placeholder: 'San Francisco, CA' },
    {
        key: 'summary',
        label: 'Summary',
        placeholder: 'Brief professional summary...',
        multiline: true,
    },
];
