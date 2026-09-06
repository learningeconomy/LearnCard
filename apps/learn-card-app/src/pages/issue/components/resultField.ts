import {
    staticField,
    type AlignmentTemplate,
    type OBv3CredentialTemplate,
    type ResultTemplate,
    type ResultDescriptionTemplate,
    type RubricCriterionLevelTemplate,
    type TemplateFieldValue,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import * as m from '../../../paraglide/messages.js';

export type ResultType =
    | 'LetterGrade'
    | 'Percent'
    | 'GradePointAverage'
    | 'RawScore'
    | 'RubricCriterionLevel'
    | 'Status';

export interface ResultTypeOption {
    value: ResultType;
    label: string;
    placeholder: string;
    profileSupported: boolean;
}

export const RESULT_TYPE_OPTIONS: ResultTypeOption[] = [
    { value: 'Percent', label: 'Percent', placeholder: 'e.g. 95', profileSupported: true },
    { value: 'RawScore', label: 'Raw score', placeholder: 'e.g. 720', profileSupported: true },
    {
        value: 'RubricCriterionLevel',
        label: 'Rubric level',
        placeholder: 'e.g. 3',
        profileSupported: true,
    },
    {
        value: 'LetterGrade',
        label: 'Letter grade',
        placeholder: 'e.g. A-',
        profileSupported: false,
    },
    {
        value: 'GradePointAverage',
        label: 'GPA',
        placeholder: 'e.g. 3.8',
        profileSupported: false,
    },
    { value: 'Status', label: 'Status', placeholder: '', profileSupported: false },
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
    valueMin: string;
    valueMax: string;
    rubricCriterionLevel?: RubricCriterionLevelTemplate[];
    alignment?: AlignmentTemplate[];
    achievedLevel: string;
    achievedLevelField?: TemplateFieldValue;
    resultDescription?: ResultDescriptionTemplate;
    /** True when imported from a bare result with no linked ResultDescription. */
    isLegacyUntyped: boolean;
}

export const readResultState = (template: OBv3CredentialTemplate): ResultState => {
    const result = template.credentialSubject.result?.[0];
    const descriptions = template.credentialSubject.achievement.resultDescription;
    const descId = result?.resultDescription?.value;
    const desc =
        descriptions?.find(description => description.id === descId) ??
        descriptions?.find(description => description.name?.value === DEFAULT_RESULT_NAME);

    if (!result && !desc) {
        return {
            resultType: 'Percent',
            value: '',
            valueMin: '',
            valueMax: '',
            achievedLevel: '',
            isLegacyUntyped: false,
        };
    }

    if (result && !desc?.resultType?.value) {
        const valueField = result.value ?? result.status;
        return {
            resultType: 'Percent',
            value: valueField?.value ?? '',
            valueField,
            valueMin: '',
            valueMax: '',
            achievedLevel: result.achievedLevel?.value ?? '',
            achievedLevelField: result.achievedLevel,
            isLegacyUntyped: true,
        };
    }

    const resultType = (desc?.resultType?.value ?? 'Percent') as ResultType;
    const valueField = resultType === 'Status' ? result?.status : result?.value;

    return {
        resultType,
        value: valueField?.value ?? '',
        valueField,
        valueMin: resultType === 'Percent' ? '0' : (desc?.valueMin?.value ?? ''),
        valueMax: resultType === 'Percent' ? '100' : (desc?.valueMax?.value ?? ''),
        rubricCriterionLevel: desc?.rubricCriterionLevel,
        alignment: desc?.alignment,
        achievedLevel: result?.achievedLevel?.value ?? '',
        achievedLevelField: result?.achievedLevel,
        resultDescription: desc,
        isLegacyUntyped: false,
    };
};

const toField = (value: string | TemplateFieldValue | undefined): TemplateFieldValue | undefined =>
    typeof value === 'string' ? staticField(value) : value;

const buildResultDescription = (
    id: string,
    resultType: ResultType,
    config: {
        valueMin?: TemplateFieldValue;
        valueMax?: TemplateFieldValue;
        rubricCriterionLevel?: RubricCriterionLevelTemplate[];
        alignment?: AlignmentTemplate[];
    }
): ResultDescriptionTemplate => ({
    id,
    name: staticField(DEFAULT_RESULT_NAME),
    resultType: staticField(resultType),
    ...(resultType === 'Percent'
        ? { valueMin: staticField('0'), valueMax: staticField('100') }
        : {
              ...(config.valueMin ? { valueMin: config.valueMin } : {}),
              ...(config.valueMax ? { valueMax: config.valueMax } : {}),
          }),
    ...(resultType === 'RubricCriterionLevel' && config.rubricCriterionLevel
        ? { rubricCriterionLevel: config.rubricCriterionLevel }
        : {}),
    ...(config.alignment ? { alignment: config.alignment } : {}),
});

const buildResult = (
    id: string,
    resultType: ResultType,
    field: TemplateFieldValue,
    achievedLevel?: TemplateFieldValue
): ResultTemplate => {
    const result =
        resultType === 'Status'
            ? { id: 'result_0', resultDescription: staticField(id), status: field }
            : { id: 'result_0', resultDescription: staticField(id), value: field };

    return resultType === 'RubricCriterionLevel' && achievedLevel
        ? { ...result, achievedLevel }
        : result;
};

export interface ResultUpdate {
    resultType: ResultType;
    value: string | TemplateFieldValue;
    valueMin?: string | TemplateFieldValue;
    valueMax?: string | TemplateFieldValue;
    rubricCriterionLevel?: RubricCriterionLevelTemplate[];
    alignment?: AlignmentTemplate[];
    achievedLevel?: string | TemplateFieldValue;
}

export const writeResult = (
    template: OBv3CredentialTemplate,
    next: ResultUpdate
): OBv3CredentialTemplate => {
    const { resultType } = next;
    const field = toField(next.value) ?? staticField('');
    const achievement = template.credentialSubject.achievement;
    const existingDescription = achievement.resultDescription?.find(
        description => description.name?.value === DEFAULT_RESULT_NAME
    );
    const sameType = existingDescription?.resultType?.value === resultType;
    const valueMin =
        toField(next.valueMin) ?? (sameType ? existingDescription?.valueMin : undefined);
    const valueMax =
        toField(next.valueMax) ?? (sameType ? existingDescription?.valueMax : undefined);
    const rubricCriterionLevel =
        next.rubricCriterionLevel ??
        (sameType ? existingDescription?.rubricCriterionLevel : undefined);
    const alignment = next.alignment ?? existingDescription?.alignment;
    const achievedLevel = toField(next.achievedLevel);
    const hasDescriptionConfiguration = Boolean(
        valueMin?.value.trim() ||
        valueMax?.value.trim() ||
        rubricCriterionLevel?.length ||
        alignment?.length
    );
    const hasValue = field.isDynamic || Boolean(field.value.trim());

    if (!hasValue && !hasDescriptionConfiguration) {
        const remainingDescriptions = achievement.resultDescription?.filter(
            description =>
                description.name?.value !== DEFAULT_RESULT_NAME ||
                description.resultType?.value === undefined
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

    const id = existingDescription?.id ?? newResultDescriptionId();
    const otherDescriptions =
        achievement.resultDescription?.filter(
            description => description.name?.value !== DEFAULT_RESULT_NAME
        ) ?? [];

    return {
        ...template,
        credentialSubject: {
            ...template.credentialSubject,
            result: hasValue ? [buildResult(id, resultType, field, achievedLevel)] : undefined,
            achievement: {
                ...achievement,
                resultDescription: [
                    ...otherDescriptions,
                    buildResultDescription(id, resultType, {
                        valueMin,
                        valueMax,
                        rubricCriterionLevel,
                        alignment,
                    }),
                ],
            },
        },
    };
};

const PROFILE_RESULT_TYPES = new Set<ResultType>(['Percent', 'RawScore', 'RubricCriterionLevel']);

const resolveFieldValue = (
    field: TemplateFieldValue | undefined,
    variableValues?: Record<string, string>
): string | undefined => {
    if (!field) return '';
    if (!field.isDynamic) return field.value.trim();
    if (!variableValues) return undefined;
    return variableValues[field.variableName]?.trim() ?? '';
};

export const getResultValidationError = (
    template: OBv3CredentialTemplate,
    variableValues?: Record<string, string>
): string | null => {
    const state = readResultState(template);
    const result = template.credentialSubject.result?.[0];
    const description = state.resultDescription;

    if (!result && !description) return null;

    for (const alignment of state.alignment ?? []) {
        if (!alignment.targetName.value.trim() || !alignment.targetUrl.value.trim()) {
            return 'Add a name and URL for each result alignment.';
        }
        if (!/^https?:\/\//i.test(alignment.targetUrl.value.trim())) {
            return 'Enter a valid URL for each result alignment.';
        }
    }

    const minimum = state.valueMin ? Number(state.valueMin) : undefined;
    const maximum = state.valueMax ? Number(state.valueMax) : undefined;
    if (
        (state.valueMin && !Number.isFinite(minimum)) ||
        (state.valueMax && !Number.isFinite(maximum))
    ) {
        return 'Use numeric minimum and maximum values.';
    }
    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
        return 'The minimum result cannot exceed the maximum result.';
    }

    if (state.resultType === 'RubricCriterionLevel') {
        const levels = state.rubricCriterionLevel ?? [];
        if (levels.length === 0) return 'Add at least one rubric level.';
        const ids = new Set<string>();
        for (const level of levels) {
            if (
                !level.id.trim() ||
                !level.name.value.trim() ||
                !level.level.value.trim() ||
                !level.points.value.trim()
            ) {
                return 'Complete the id, name, level, and points for each rubric level.';
            }
            if (ids.has(level.id)) return 'Use a unique id for each rubric level.';
            ids.add(level.id);
            if (!Number.isFinite(Number(level.points.value))) {
                return 'Enter numeric points for each rubric level.';
            }
        }
        const achievedLevel = resolveFieldValue(state.achievedLevelField, variableValues);
        if (result && achievedLevel === '') return 'Choose an achieved rubric level.';
        if (achievedLevel !== undefined && achievedLevel && !ids.has(achievedLevel)) {
            return 'Choose one of the declared rubric levels.';
        }
    }

    if (!PROFILE_RESULT_TYPES.has(state.resultType)) return null;

    const value = resolveFieldValue(state.valueField, variableValues);
    if (value === undefined) return null;
    if (!value || !Number.isFinite(Number(value))) return 'Enter a numeric result.';

    const numericValue = Number(value);
    if (
        (minimum !== undefined && numericValue < minimum) ||
        (maximum !== undefined && numericValue > maximum)
    ) {
        if (minimum !== undefined && maximum !== undefined) {
            return `Enter a result from ${state.valueMin} to ${state.valueMax}.`;
        }
        if (minimum !== undefined) return `Enter a result of at least ${state.valueMin}.`;
        return `Enter a result no higher than ${state.valueMax}.`;
    }

    return null;
};
