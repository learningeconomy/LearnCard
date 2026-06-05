import {
    staticField,
    type OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import type { ActivityField } from './credentialTypeCatalog';

export type FieldInputType = 'text' | 'date' | 'select' | 'result';

export interface FieldSelectOption {
    value: string;
    label: string;
}

export interface FieldDescriptor {
    key: ActivityField;
    label: string;
    placeholder?: string;
    input: FieldInputType;
    options?: FieldSelectOption[];
    /** OBv3 binding (e.g. 'Achievement.humanCode') — the auditable record of standards-purity. */
    specRef: string;
    get: (template: OBv3CredentialTemplate) => string;
    set: (template: OBv3CredentialTemplate, value: string) => OBv3CredentialTemplate;
}

const patchSubject = (
    template: OBv3CredentialTemplate,
    patch: Partial<OBv3CredentialTemplate['credentialSubject']>
): OBv3CredentialTemplate => ({
    ...template,
    credentialSubject: { ...template.credentialSubject, ...patch },
});

const patchAchievement = (
    template: OBv3CredentialTemplate,
    patch: Partial<OBv3CredentialTemplate['credentialSubject']['achievement']>
): OBv3CredentialTemplate => ({
    ...template,
    credentialSubject: {
        ...template.credentialSubject,
        achievement: { ...template.credentialSubject.achievement, ...patch },
    },
});

export const dateValue = (iso?: string): string => (iso ? iso.slice(0, 10) : '');
export const toIso = (date: string): string => (date ? new Date(date).toISOString() : '');

const subjectDateDescriptor = (
    key: ActivityField,
    label: string,
    subjectKey: 'activityStartDate' | 'activityEndDate',
    specRef: string
): FieldDescriptor => ({
    key,
    label,
    input: 'date',
    specRef,
    get: t => dateValue(t.credentialSubject[subjectKey]?.value),
    set: (t, v) => patchSubject(t, { [subjectKey]: staticField(toIso(v)) }),
});

const subjectTextDescriptor = (
    key: ActivityField,
    label: string,
    placeholder: string,
    subjectKey: 'creditsEarned' | 'licenseNumber' | 'role' | 'term',
    specRef: string
): FieldDescriptor => ({
    key,
    label,
    placeholder,
    input: 'text',
    specRef,
    get: t => t.credentialSubject[subjectKey]?.value ?? '',
    set: (t, v) => patchSubject(t, { [subjectKey]: staticField(v) }),
});

const BASE_DESCRIPTORS: Record<Exclude<ActivityField, 'score'>, FieldDescriptor> = {
    completionDate: subjectDateDescriptor(
        'completionDate',
        'Completion date',
        'activityEndDate',
        'AchievementSubject.activityEndDate'
    ),
    startDate: subjectDateDescriptor(
        'startDate',
        'Start date',
        'activityStartDate',
        'AchievementSubject.activityStartDate'
    ),
    creditsEarned: subjectTextDescriptor(
        'creditsEarned',
        'Credits earned',
        'e.g. 3',
        'creditsEarned',
        'AchievementSubject.creditsEarned'
    ),
    term: subjectTextDescriptor(
        'term',
        'Term',
        'e.g. Fall 2025',
        'term',
        'AchievementSubject.term'
    ),
    licenseNumber: subjectTextDescriptor(
        'licenseNumber',
        'License number',
        'e.g. RN-1234567',
        'licenseNumber',
        'AchievementSubject.licenseNumber'
    ),
    role: subjectTextDescriptor(
        'role',
        'Role or level',
        'e.g. Gold Member',
        'role',
        'AchievementSubject.role'
    ),

    // creditsAvailable is the achievement's capacity; creditsEarned (above) is what the
    // recipient earned. Distinct OBv3 paths that must not be conflated.
    creditHours: {
        key: 'creditHours',
        label: 'Duration / hours',
        placeholder: 'e.g. 10 hours',
        input: 'text',
        specRef: 'Achievement.creditsAvailable',
        get: t => t.credentialSubject.achievement.creditsAvailable?.value ?? '',
        set: (t, v) => patchAchievement(t, { creditsAvailable: staticField(v) }),
    },

    humanCode: {
        key: 'humanCode',
        label: 'Course code',
        placeholder: 'e.g. CS101',
        input: 'text',
        specRef: 'Achievement.humanCode',
        get: t => t.credentialSubject.achievement.humanCode?.value ?? '',
        set: (t, v) => patchAchievement(t, { humanCode: staticField(v) }),
    },

    fieldOfStudy: {
        key: 'fieldOfStudy',
        label: 'Field of study',
        placeholder: 'e.g. Computer Science',
        input: 'text',
        specRef: 'Achievement.fieldOfStudy',
        get: t => t.credentialSubject.achievement.fieldOfStudy?.value ?? '',
        set: (t, v) => patchAchievement(t, { fieldOfStudy: staticField(v) }),
    },

    specialization: {
        key: 'specialization',
        label: 'Specialization',
        placeholder: 'e.g. Machine Learning',
        input: 'text',
        specRef: 'Achievement.specialization',
        get: t => t.credentialSubject.achievement.specialization?.value ?? '',
        set: (t, v) => patchAchievement(t, { specialization: staticField(v) }),
    },

    version: {
        key: 'version',
        label: 'Version',
        placeholder: 'e.g. 2.1',
        input: 'text',
        specRef: 'Achievement.version',
        get: t => t.credentialSubject.achievement.version?.value ?? '',
        set: (t, v) => patchAchievement(t, { version: staticField(v) }),
    },

    // validUntil lives at the VC v2 credential top level, not inside credentialSubject.
    expiryDate: {
        key: 'expiryDate',
        label: 'Expires on',
        input: 'date',
        specRef: 'Credential.validUntil (VC v2)',
        get: t => dateValue(t.validUntil?.value),
        set: (t, v) => ({ ...t, validUntil: staticField(toIso(v)) }),
    },

    memberId: {
        key: 'memberId',
        label: 'Member ID',
        placeholder: 'e.g. M-00482',
        input: 'text',
        specRef: 'AchievementSubject.identifier[] (IdentityObject, identityType=memberId)',
        get: t => t.credentialSubject.identifier?.[0]?.identifier?.value ?? '',
        set: (t, v) =>
            patchSubject(t, {
                identifier: v
                    ? [
                          {
                              id: 'member_id_entry',
                              identifier: staticField(v),
                              identifierType: staticField('memberId'),
                          },
                      ]
                    : undefined,
            }),
    },
};

export const FIELD_DESCRIPTORS: Record<ActivityField, FieldDescriptor> = BASE_DESCRIPTORS as Record<
    ActivityField,
    FieldDescriptor
>;

export const getDescriptor = (key: ActivityField): FieldDescriptor => FIELD_DESCRIPTORS[key];
