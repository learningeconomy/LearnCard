import type { VC } from '@learncard/types';
import { CredentialCategoryEnum } from 'learn-card-base';
import type { CredentialCategory } from 'learn-card-base/types/credentials';
import { getDefaultCategoryForCredential } from 'learn-card-base/helpers/credentialHelpers';

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
    // TODO: Re-enable when skills are supported
    // TODO: skills framework required?
    // {
    //     key: CredentialCategoryEnum.skill,
    //     label: 'Skills',
    // },
    {
        key: CredentialCategoryEnum.socialBadge,
        label: 'Badges & Certifications',
    },
    {
        key: CredentialCategoryEnum.accommodation,
        label: 'Accommodations',
    },
] as const;

export type ResumeSectionKey = (typeof RESUME_SECTIONS)[number]['key'];

export type ResumeCredentialRecord = {
    vc?: VC | null;
    uri: string;
    category?: CredentialCategory;
    title?: string;
};

const RESUME_SECTION_FALLBACK_CATEGORY_ALIASES: Partial<Record<ResumeSectionKey, string[]>> = {
    [CredentialCategoryEnum.workHistory]: [
        CredentialCategoryEnum.workHistory,
        'Job',
        CredentialCategoryEnum.experience,
        CredentialCategoryEnum.workExperience,
    ],
    [CredentialCategoryEnum.learningHistory]: [
        CredentialCategoryEnum.learningHistory,
        CredentialCategoryEnum.course,
    ],
};

const isResumeCredentialRecord = (
    record:
        | { vc?: VC | null; uri?: string; category?: CredentialCategory; title?: string }
        | null
        | undefined
): record is ResumeCredentialRecord => Boolean(record?.uri);

export const toResumeCredentialRecords = (
    records:
        | Array<{ vc?: VC | null; uri?: string; category?: CredentialCategory; title?: string }>
        | undefined
): ResumeCredentialRecord[] => (records ?? []).filter(isResumeCredentialRecord);

export const getResumeCredentialRecordsForSection = (
    sectionKey: ResumeSectionKey,
    exactRecords: ResumeCredentialRecord[],
    allRecords: ResumeCredentialRecord[]
): ResumeCredentialRecord[] => {
    const fallbackAliases = RESUME_SECTION_FALLBACK_CATEGORY_ALIASES[sectionKey];
    const aliases = new Set([sectionKey, ...(fallbackAliases ?? [])]);
    const recordsByUri = new Map<string, ResumeCredentialRecord>();

    allRecords.forEach(record => {
        if (record.category && aliases.has(record.category)) recordsByUri.set(record.uri, record);

        if (!fallbackAliases) return;

        if (!record.vc) return;

        const category = getDefaultCategoryForCredential(record.vc, { skipValidation: true });

        if (aliases.has(category)) recordsByUri.set(record.uri, record);
    });
    exactRecords.forEach(record => {
        if (!recordsByUri.has(record.uri)) recordsByUri.set(record.uri, record);
    });

    return [...recordsByUri.values()];
};

export enum UserInfoEnum {
    Name = 'name',
    Career = 'career',
    Email = 'email',
    Phone = 'phone',
    Location = 'location',
    Summary = 'summary',
    Website = 'website',
    LinkedIn = 'linkedIn',
    Thumbnail = 'thumbnail',
}

export type PersonalDetails = Record<UserInfoEnum, string>;

export type ResumeUserInfo = {
    key: UserInfoEnum;
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

export type ResumeFieldType = 'description' | 'metadata';

export type ResumeFieldEntry = {
    id: string;
    value: string;
    source: ResumeFieldSource;
    type: ResumeFieldType;
    index: number;
    hidden?: boolean;
};

export type CredentialEntry = {
    uri: string;
    index: number;
    fields: ResumeFieldEntry[];
};

export const resumeUserInfo: ResumeUserInfo[] = [
    { key: UserInfoEnum.Name, label: 'Full Name', placeholder: 'Jane Doe' },
    { key: UserInfoEnum.Career, label: 'Professional Title', placeholder: 'Software Engineer' },
    { key: UserInfoEnum.Location, label: 'Location', placeholder: 'San Francisco, CA' },
    {
        key: UserInfoEnum.Summary,
        label: 'Professional Summary',
        placeholder: 'Brief professional summary...',
        multiline: true,
    },
    { key: UserInfoEnum.Email, label: 'Email', placeholder: 'jane@example.com' },
    { key: UserInfoEnum.Phone, label: 'Phone', placeholder: '+1 (555) 000-0000' },
    { key: UserInfoEnum.Website, label: 'Website', placeholder: 'https://example.com' },
    {
        key: UserInfoEnum.LinkedIn,
        label: 'LinkedIn',
        placeholder: 'https://linkedin.com/in/janedoe',
    },
];

export const getLinkedInHandle = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';

    const withoutProtocol = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const noQueryOrHash = withoutProtocol.split('?')[0].split('#')[0];
    const noTrailingSlash = noQueryOrHash.replace(/\/+$/, '');
    const cleaned = noTrailingSlash.replace(/^@/, '').replace(/^\/+/, '');

    const linkedInPathMatch = cleaned.match(/linkedin\.com\/in\/([^/]+)/i);
    if (linkedInPathMatch?.[1]) return linkedInPathMatch[1];

    const slashIndex = cleaned.lastIndexOf('/');
    const lastSegment = slashIndex >= 0 ? cleaned.slice(slashIndex + 1) : cleaned;

    return lastSegment || cleaned;
};
