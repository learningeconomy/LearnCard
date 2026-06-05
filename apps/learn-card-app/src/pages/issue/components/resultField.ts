import {
    staticField,
    type OBv3CredentialTemplate,
    type ResultTemplate,
    type ResultDescriptionTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

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
        return {
            resultType: 'LetterGrade',
            value: result.value?.value ?? result.status?.value ?? '',
            isLegacyUntyped: true,
        };
    }

    const resultType = desc.resultType.value as ResultType;
    const value = resultType === 'Status' ? result.status?.value ?? '' : result.value?.value ?? '';
    return { resultType, value, isLegacyUntyped: false };
};

const buildResultDescription = (id: string, resultType: ResultType): ResultDescriptionTemplate => ({
    id,
    name: staticField(DEFAULT_RESULT_NAME),
    resultType: staticField(resultType),
});

const buildResult = (id: string, resultType: ResultType, value: string): ResultTemplate =>
    resultType === 'Status'
        ? { id: 'result_0', resultDescription: staticField(id), status: staticField(value) }
        : { id: 'result_0', resultDescription: staticField(id), value: staticField(value) };

export const writeResult = (
    template: OBv3CredentialTemplate,
    next: { resultType: ResultType; value: string }
): OBv3CredentialTemplate => {
    const { resultType, value } = next;
    const achievement = template.credentialSubject.achievement;

    if (!value.trim()) {
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
            result: [buildResult(id, resultType, value)],
            achievement: {
                ...achievement,
                resultDescription: [...otherDescriptions, buildResultDescription(id, resultType)],
            },
        },
    };
};
