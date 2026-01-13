/**
 * Template presets for common credential types
 */

import {
    OBv3CredentialTemplate,
    staticField,
    dynamicField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
} from './types';

export interface TemplatePreset {
    id: string;
    name: string;
    description: string;
    icon: string; // Lucide icon name
    template: OBv3CredentialTemplate;
}

// Helper to create a base template
const createBaseTemplate = (overrides: Partial<OBv3CredentialTemplate>): OBv3CredentialTemplate => ({
    contexts: DEFAULT_CONTEXTS,
    types: DEFAULT_TYPES,
    name: staticField(''),
    issuer: {
        id: systemField('issuer_did'),
        name: staticField(''),
    },
    credentialSubject: {
        name: dynamicField('recipient_name', ''),
        achievement: {
            name: staticField(''),
            description: staticField(''),
        },
    },
    validFrom: systemField('issue_date'),
    customFields: [],
    ...overrides,
});

export const TEMPLATE_PRESETS: TemplatePreset[] = [
    {
        id: 'blank',
        name: 'Blank Template',
        description: 'Start from scratch with a minimal template',
        icon: 'FileText',
        template: createBaseTemplate({}),
    },
    {
        id: 'course-completion',
        name: 'Course Completion',
        description: 'Certificate for completing a course or training',
        icon: 'GraduationCap',
        template: createBaseTemplate({
            name: staticField('Course Completion Certificate'),
            description: staticField('Awarded for successfully completing the course requirements.'),
            credentialSubject: {
                name: dynamicField('recipient_name', ''),
                achievement: {
                    name: dynamicField('course_name', 'Course Name'),
                    description: dynamicField('course_description', 'Course description'),
                    achievementType: staticField('Course'),
                    criteria: {
                        narrative: staticField('Successfully completed all course requirements and assessments.'),
                    },
                },
            },
            customFields: [
                {
                    id: 'completion_date',
                    key: staticField('completionDate'),
                    value: dynamicField('completion_date', ''),
                },
                {
                    id: 'score',
                    key: staticField('score'),
                    value: dynamicField('score', ''),
                },
            ],
        }),
    },
    {
        id: 'badge',
        name: 'Achievement Badge',
        description: 'Digital badge for achievements and skills',
        icon: 'Award',
        template: createBaseTemplate({
            name: staticField('Achievement Badge'),
            description: staticField('Awarded for demonstrating proficiency.'),
            credentialSubject: {
                name: dynamicField('recipient_name', ''),
                achievement: {
                    name: dynamicField('badge_name', 'Badge Name'),
                    description: dynamicField('badge_description', 'Badge description'),
                    achievementType: staticField('Badge'),
                    image: dynamicField('badge_image', ''),
                    criteria: {
                        narrative: dynamicField('criteria_narrative', 'Criteria for earning this badge.'),
                    },
                },
            },
        }),
    },
    {
        id: 'certificate',
        name: 'Professional Certificate',
        description: 'Formal certificate for professional achievements',
        icon: 'ScrollText',
        template: createBaseTemplate({
            name: staticField('Professional Certificate'),
            description: staticField('This certificate recognizes professional achievement.'),
            credentialSubject: {
                name: dynamicField('recipient_name', ''),
                achievement: {
                    name: dynamicField('certificate_name', 'Certificate Name'),
                    description: dynamicField('certificate_description', 'Certificate description'),
                    achievementType: staticField('Certificate'),
                    criteria: {
                        narrative: staticField('Met all requirements for this professional certificate.'),
                    },
                },
            },
            validUntil: dynamicField('expiration_date', ''),
        }),
    },
    {
        id: 'skill',
        name: 'Skill Credential',
        description: 'Verify a specific skill or competency',
        icon: 'Sparkles',
        template: createBaseTemplate({
            name: staticField('Skill Credential'),
            description: staticField('Verifies proficiency in a specific skill.'),
            credentialSubject: {
                name: dynamicField('recipient_name', ''),
                achievement: {
                    name: dynamicField('skill_name', 'Skill Name'),
                    description: dynamicField('skill_description', 'Description of the skill'),
                    achievementType: staticField('Competency'),
                    criteria: {
                        narrative: dynamicField('skill_criteria', 'Demonstrated proficiency through assessment.'),
                    },
                },
            },
            customFields: [
                {
                    id: 'proficiency_level',
                    key: staticField('proficiencyLevel'),
                    value: dynamicField('proficiency_level', 'Proficient'),
                },
            ],
        }),
    },
    {
        id: 'license',
        name: 'License',
        description: 'Professional or occupational license',
        icon: 'Shield',
        template: createBaseTemplate({
            name: staticField('Professional License'),
            description: staticField('Official license to practice.'),
            credentialSubject: {
                name: dynamicField('recipient_name', ''),
                achievement: {
                    name: dynamicField('license_name', 'License Name'),
                    description: dynamicField('license_description', 'License description'),
                    achievementType: staticField('License'),
                    criteria: {
                        narrative: staticField('Met all requirements for licensure.'),
                    },
                },
            },
            validUntil: dynamicField('expiration_date', ''),
            customFields: [
                {
                    id: 'license_number',
                    key: staticField('licenseNumber'),
                    value: dynamicField('license_number', ''),
                },
                {
                    id: 'issuing_authority',
                    key: staticField('issuingAuthority'),
                    value: dynamicField('issuing_authority', ''),
                },
            ],
        }),
    },
    {
        id: 'membership',
        name: 'Membership',
        description: 'Organization or program membership',
        icon: 'Users',
        template: createBaseTemplate({
            name: staticField('Membership Credential'),
            description: staticField('Verifies membership status.'),
            credentialSubject: {
                name: dynamicField('recipient_name', ''),
                achievement: {
                    name: dynamicField('membership_name', 'Membership Name'),
                    description: dynamicField('membership_description', 'Membership description'),
                    achievementType: staticField('Membership'),
                    criteria: {
                        narrative: staticField('Active member in good standing.'),
                    },
                },
            },
            validUntil: dynamicField('membership_expiration', ''),
            customFields: [
                {
                    id: 'member_id',
                    key: staticField('memberId'),
                    value: dynamicField('member_id', ''),
                },
                {
                    id: 'membership_level',
                    key: staticField('membershipLevel'),
                    value: dynamicField('membership_level', 'Standard'),
                },
            ],
        }),
    },
    {
        id: 'micro-credential',
        name: 'Micro-Credential',
        description: 'Short-form credential for specific learning',
        icon: 'Zap',
        template: createBaseTemplate({
            name: staticField('Micro-Credential'),
            description: staticField('Recognizes completion of focused learning.'),
            credentialSubject: {
                name: dynamicField('recipient_name', ''),
                achievement: {
                    name: dynamicField('micro_credential_name', 'Micro-Credential Name'),
                    description: dynamicField('micro_credential_description', 'What was learned'),
                    achievementType: staticField('MicroCredential'),
                    criteria: {
                        narrative: dynamicField('learning_objectives', 'Completed all learning objectives.'),
                    },
                },
            },
            customFields: [
                {
                    id: 'duration_hours',
                    key: staticField('durationHours'),
                    value: dynamicField('duration_hours', ''),
                },
            ],
        }),
    },
];

export const getPresetById = (id: string): TemplatePreset | undefined => {
    return TEMPLATE_PRESETS.find(p => p.id === id);
};

export const getBlankTemplate = (): OBv3CredentialTemplate => {
    // Deep clone to avoid mutating the preset
    return JSON.parse(JSON.stringify(TEMPLATE_PRESETS.find(p => p.id === 'blank')!.template));
};
