/**
 * Template presets for common credential types
 */

import {
    OBv3CredentialTemplate,
    AchievementEntryTemplate,
    AssociationTemplate,
    staticField,
    dynamicField,
    systemField,
    DEFAULT_CONTEXTS,
    DEFAULT_TYPES,
    CLR2_CONTEXTS,
    CLR2_TYPES,
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
        id: systemField('recipient_did'),
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
                    name: dynamicField('course_name', ''),
                    description: dynamicField('course_description', ''),
                    achievementType: staticField('Course'),
                    humanCode: dynamicField('course_code', ''),
                    criteria: {
                        narrative: staticField('Successfully completed all course requirements and assessments.'),
                    },
                },
                activityEndDate: dynamicField('completion_date', ''),
                result: [
                    {
                        id: 'result_score',
                        value: dynamicField('score', ''),
                    },
                ],
            },
            customFields: [],
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
                    name: dynamicField('badge_name', ''),
                    description: dynamicField('badge_description', ''),
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
                    name: dynamicField('certificate_name', ''),
                    description: dynamicField('certificate_description', ''),
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
                    name: dynamicField('skill_name', ''),
                    description: dynamicField('skill_description', ''),
                    achievementType: staticField('Competency'),
                    criteria: {
                        narrative: dynamicField('skill_criteria', 'Demonstrated proficiency through assessment.'),
                    },
                },
                result: [
                    {
                        id: 'result_proficiency',
                        value: dynamicField('proficiency_level', 'Proficient'),
                    },
                ],
            },
            customFields: [],
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
                    name: dynamicField('license_name', ''),
                    description: dynamicField('license_description', ''),
                    achievementType: staticField('License'),
                    criteria: {
                        narrative: staticField('Met all requirements for licensure.'),
                    },
                },
                licenseNumber: dynamicField('license_number', ''),
            },
            validUntil: dynamicField('expiration_date', ''),
            customFields: [],
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
                    name: dynamicField('membership_name', ''),
                    description: dynamicField('membership_description', ''),
                    achievementType: staticField('Membership'),
                    criteria: {
                        narrative: staticField('Active member in good standing.'),
                    },
                },
                identifier: [
                    {
                        id: 'member_id_entry',
                        identifier: dynamicField('member_id', ''),
                        identifierType: staticField('memberId'),
                    },
                ],
                role: dynamicField('membership_level', 'Standard'),
            },
            customFields: [],
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
                    name: dynamicField('micro_credential_name', ''),
                    description: dynamicField('micro_credential_description', ''),
                    achievementType: staticField('MicroCredential'),
                    creditsAvailable: dynamicField('duration_hours', ''),
                    criteria: {
                        narrative: dynamicField('learning_objectives', 'Completed all learning objectives.'),
                    },
                },
            },
            customFields: [],
        }),
    },
];

// Helper to create a CLR 2.0 base template
const createClrBaseTemplate = (
    name: string,
    achievements: AchievementEntryTemplate[],
    associations: AssociationTemplate[] = [],
    overrides: Partial<OBv3CredentialTemplate> = {}
): OBv3CredentialTemplate => ({
    schemaType: 'clr2',
    contexts: CLR2_CONTEXTS,
    types: CLR2_TYPES,
    name: staticField(name),
    issuer: {
        id: systemField('issuer_did'),
        name: staticField(''),
    },
    credentialSubject: {
        id: systemField('recipient_did'),
        achievement: achievements[0]?.achievement || { name: staticField(''), description: staticField('') },
    },
    clrSubject: {
        achievements,
        associations,
    },
    validFrom: systemField('issue_date'),
    customFields: [],
    ...overrides,
});

// CLR 2.0 Presets
export const CLR2_PRESETS: TemplatePreset[] = [
    {
        id: 'academic-transcript',
        name: 'Academic Transcript',
        description: 'Multi-course transcript with GPA',
        icon: 'BookOpen',
        template: createClrBaseTemplate(
            'Academic Transcript',
            [
                {
                    id: 'ach_1',
                    achievement: {
                        name: staticField('Introduction to Computer Science'),
                        description: staticField('Foundational CS concepts'),
                        achievementType: staticField('Course'),
                        humanCode: staticField('CS101'),
                        creditsAvailable: staticField('3'),
                        fieldOfStudy: staticField('Computer Science'),
                        criteria: { narrative: staticField('Complete all coursework and final exam') },
                    },
                    result: [{
                        id: 'result_1',
                        value: dynamicField('course_1_grade', ''),
                        status: staticField('Completed'),
                    }],
                    creditsEarned: dynamicField('course_1_credits', ''),
                },
                {
                    id: 'ach_2',
                    achievement: {
                        name: staticField('Data Structures'),
                        description: staticField('Advanced data structures and algorithms'),
                        achievementType: staticField('Course'),
                        humanCode: staticField('CS201'),
                        creditsAvailable: staticField('3'),
                        fieldOfStudy: staticField('Computer Science'),
                        criteria: { narrative: staticField('Complete all coursework and final exam') },
                    },
                    result: [{
                        id: 'result_2',
                        value: dynamicField('course_2_grade', ''),
                        status: staticField('Completed'),
                    }],
                    creditsEarned: dynamicField('course_2_credits', ''),
                },
                {
                    id: 'ach_3',
                    achievement: {
                        name: staticField('Software Engineering'),
                        description: staticField('Software development methodologies'),
                        achievementType: staticField('Course'),
                        humanCode: staticField('CS301'),
                        creditsAvailable: staticField('3'),
                        fieldOfStudy: staticField('Computer Science'),
                        criteria: { narrative: staticField('Complete all coursework and capstone project') },
                    },
                    result: [{
                        id: 'result_3',
                        value: dynamicField('course_3_grade', ''),
                        status: staticField('Completed'),
                    }],
                    creditsEarned: dynamicField('course_3_credits', ''),
                },
            ],
        ),
    },
    {
        id: 'program-completion',
        name: 'Program Completion',
        description: 'Program with child courses and associations',
        icon: 'GraduationCap',
        template: createClrBaseTemplate(
            'Program Completion Record',
            [
                {
                    id: 'ach_program',
                    achievement: {
                        name: staticField('Bachelor of Science in Computer Science'),
                        description: staticField('Undergraduate degree program'),
                        achievementType: staticField('BachelorDegree'),
                        fieldOfStudy: staticField('Computer Science'),
                        criteria: { narrative: staticField('Complete all required courses and maintain minimum GPA') },
                    },
                },
                {
                    id: 'ach_course_1',
                    achievement: {
                        name: staticField('Introduction to Programming'),
                        description: staticField('Foundational programming course'),
                        achievementType: staticField('Course'),
                        humanCode: staticField('CS101'),
                        creditsAvailable: staticField('3'),
                        criteria: { narrative: staticField('Complete coursework') },
                    },
                    result: [{
                        id: 'result_c1',
                        value: dynamicField('course_1_grade', ''),
                        status: staticField('Completed'),
                    }],
                },
                {
                    id: 'ach_course_2',
                    achievement: {
                        name: staticField('Algorithms'),
                        description: staticField('Algorithm design and analysis'),
                        achievementType: staticField('Course'),
                        humanCode: staticField('CS201'),
                        creditsAvailable: staticField('3'),
                        criteria: { narrative: staticField('Complete coursework') },
                    },
                    result: [{
                        id: 'result_c2',
                        value: dynamicField('course_2_grade', ''),
                        status: staticField('Completed'),
                    }],
                },
            ],
            [
                {
                    id: 'assoc_1',
                    associationType: staticField('isChildOf'),
                    sourceAchievementId: 'ach_course_1',
                    targetAchievementId: 'ach_program',
                },
                {
                    id: 'assoc_2',
                    associationType: staticField('isChildOf'),
                    sourceAchievementId: 'ach_course_2',
                    targetAchievementId: 'ach_program',
                },
            ],
        ),
    },
    {
        id: 'competency-record',
        name: 'Competency Record',
        description: 'Multiple competency achievements',
        icon: 'Layers',
        template: createClrBaseTemplate(
            'Competency Record',
            [
                {
                    id: 'ach_comp_1',
                    achievement: {
                        name: staticField('Problem Solving'),
                        description: staticField('Ability to analyze and solve complex problems'),
                        achievementType: staticField('Competency'),
                        criteria: { narrative: staticField('Demonstrated through assessments and practical exercises') },
                    },
                    result: [{
                        id: 'result_comp_1',
                        value: dynamicField('competency_1_level', ''),
                        status: staticField('Achieved'),
                    }],
                },
                {
                    id: 'ach_comp_2',
                    achievement: {
                        name: staticField('Communication'),
                        description: staticField('Effective written and verbal communication'),
                        achievementType: staticField('Competency'),
                        criteria: { narrative: staticField('Demonstrated through presentations and written work') },
                    },
                    result: [{
                        id: 'result_comp_2',
                        value: dynamicField('competency_2_level', ''),
                        status: staticField('Achieved'),
                    }],
                },
                {
                    id: 'ach_comp_3',
                    achievement: {
                        name: staticField('Teamwork'),
                        description: staticField('Collaborative work in diverse teams'),
                        achievementType: staticField('Competency'),
                        criteria: { narrative: staticField('Demonstrated through group projects and peer evaluations') },
                    },
                    result: [{
                        id: 'result_comp_3',
                        value: dynamicField('competency_3_level', ''),
                        status: staticField('Achieved'),
                    }],
                },
            ],
        ),
    },
];

// Combined presets (OBv3 + CLR 2.0)
export const ALL_PRESETS: TemplatePreset[] = [...TEMPLATE_PRESETS, ...CLR2_PRESETS];

export const getPresetById = (id: string): TemplatePreset | undefined => {
    return ALL_PRESETS.find(p => p.id === id);
};

export const getBlankTemplate = (): OBv3CredentialTemplate => {
    // Deep clone to avoid mutating the preset
    return JSON.parse(JSON.stringify(TEMPLATE_PRESETS.find(p => p.id === 'blank')!.template));
};
