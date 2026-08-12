import {
    staticField,
    type OBv3CredentialTemplate,
    type ResultTemplate,
    type ResultDescriptionTemplate,
    type TemplateFieldValue,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import * as m from '../../../paraglide/messages.js';

export type ResultType = 'LetterGrade' | 'Percent' | 'GradePointAverage' | 'RawScore' | 'Status';

export interface ResultTypeOption {
    value: ResultType;
    label: string;
    placeholder: string;
}

export const RESULT_TYPE_OPTIONS: ResultTypeOption[] = [
    { value: 'LetterGrade', label: 'Letter grade', placeholder: 'e.g. A-' },
    { value: 'Percent', label: 'Percent', placeholder: 'e.g. 95' },
    { value: 'GradePointAverage', label: 'GPA', placeholder: 'e.g. 3.8' },
    { value: 'RawScore', label: 'Points', placeholder: 'e.g. 720' },
    { value: 'Status', label: 'Status', placeholder: '' },
];

/**
 * Resolve a paraglide message by dotted key, falling back to English when the
 * key is absent from the active locale bundle. Display strings on the data
 * above are keyed by their stable `value`/enum so translations stay stable.
 */
const msg = (key: string, fallback: string): string => {
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function' ? (fn as () => string)() : fallback;
};

/** Translated grade-type label, keyed by the stable result-type value. */
export const resultTypeLabel = (option: ResultTypeOption): string =>
    msg(`issueFlow.result.${option.value}.label`, option.label);

/** Translated grade-type input placeholder (the "e.g. …" example). */
export const resultTypePlaceholder = (option: ResultTypeOption): string =>
    msg(`issueFlow.result.${option.value}.eg`, option.placeholder);

/** Translated status option label, keyed by the stable status enum value. */
export const resultStatusLabel = (status: string): string =>
    msg(`issueFlow.result.status.${status}`, status.replace(/([A-Z])/g, ' $1').trim());

export const RESULT_STATUS_VALUES = [
    'Completed',
    'Enrolled',
    'Failed',
    'InProgress',
    'OnHold',
    'Provisional',
    'Withdrew',
] as const;

export const DEFAULT_RESULT_NAME = 'Final Grade';

const newResultDescriptionId = (): string =>
    `urn:uuid:${
        typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    }`;

export interface ResultState {
    resultType: ResultType;
    value: string;
    valueField?: TemplateFieldValue;
    /** True when imported from a bare result with no linked ResultDescription. */
    isLegacyUntyped: boolean;
}

export const readResultState = (template: OBv3CredentialTemplate): ResultState => {
    const result = template.credentialSubject.result?.[0];
    if (!result) return { resultType: 'LetterGrade', value: '', isLegacyUntyped: false };

    const descId = result.resultDescription?.value;
    const desc = template.credentialSubject.achievement.resultDescription?.find(
        d => d.id === descId
    );

    if (!desc?.resultType?.value) {
        const valueField = result.value ?? result.status;
        return {
            resultType: 'LetterGrade',
            value: valueField?.value ?? '',
            valueField,
            isLegacyUntyped: true,
        };
    }

    const resultType = desc.resultType.value as ResultType;
    const valueField = resultType === 'Status' ? result.status : result.value;
    return { resultType, value: valueField?.value ?? '', valueField, isLegacyUntyped: false };
};

const buildResultDescription = (id: string, resultType: ResultType): ResultDescriptionTemplate => ({
    id,
    name: staticField(DEFAULT_RESULT_NAME),
    resultType: staticField(resultType),
});

const buildResult = (
    id: string,
    resultType: ResultType,
    field: TemplateFieldValue
): ResultTemplate =>
    resultType === 'Status'
        ? { id: 'result_0', resultDescription: staticField(id), status: field }
        : { id: 'result_0', resultDescription: staticField(id), value: field };

export const writeResult = (
    template: OBv3CredentialTemplate,
    next: { resultType: ResultType; value: string | TemplateFieldValue }
): OBv3CredentialTemplate => {
    const { resultType } = next;
    const field = typeof next.value === 'string' ? staticField(next.value) : next.value;
    const achievement = template.credentialSubject.achievement;

    if (!field.isDynamic && !field.value.trim()) {
        const remainingDescriptions = achievement.resultDescription?.filter(
            d => d.name?.value !== DEFAULT_RESULT_NAME || d.resultType?.value === undefined
        );
        return {
            ...template,
            credentialSubject: {
                ...template.credentialSubject,
                result: undefined,
                achievement: {
                    ...achievement,
                    resultDescription:
                        remainingDescriptions && remainingDescriptions.length > 0
                            ? remainingDescriptions
                            : undefined,
                },
            },
        };
    }

    const existingId = achievement.resultDescription?.find(
        d => d.name?.value === DEFAULT_RESULT_NAME
    )?.id;
    const id = existingId ?? newResultDescriptionId();

    const otherDescriptions =
        achievement.resultDescription?.filter(d => d.name?.value !== DEFAULT_RESULT_NAME) ?? [];

    return {
        ...template,
        credentialSubject: {
            ...template.credentialSubject,
            result: [buildResult(id, resultType, field)],
            achievement: {
                ...achievement,
                resultDescription: [...otherDescriptions, buildResultDescription(id, resultType)],
            },
        },
    };
};
