import type { PersonalField, WalletCategory } from './types';

export const WALLET_CATEGORIES: WalletCategory[] = [
    'Achievement',
    'Skill',
    'ID',
    'Learning History',
    'Work History',
    'Social Badges',
    'Membership',
    'Accomplishment',
    'Experiences',
    'Accommodation',
    'Family',
];

export const PERSONAL_FIELDS: PersonalField[] = [
    'name',
    'email',
    'phone',
    'birthDate',
    'country',
    'avatar',
];

export const RESERVED_TEMPLATE_VARIABLES = ['issue_date', 'issuer_did', 'recipient_did'] as const;

export const KNOWN_ACHIEVEMENT_TYPES: string[] = [
    'Achievement',
    'Assessment',
    'Award',
    'Badge',
    'Certificate',
    'Certification',
    'CommunityService',
    'Competency',
    'Course',
    'Degree',
    'Diploma',
    'LearningProgram',
    'License',
    'Membership',
    'MicroCredential',
    'ProfessionalDevelopment',
];

export const VC2_CONTEXT = 'https://www.w3.org/ns/credentials/v2';
export const OBV3_CONTEXT = 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json';
export const TEMPLATE_VARIABLE_REGEX = /\{\{(\w+)\}\}/g;
