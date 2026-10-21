import { parseCredentialNumber } from '@learncard/helpers';
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
type MessageParams = Record<string, string | number>;

const msg = (key: string, fallback: string, params?: MessageParams): string => {
    const fn = (m as Record<string, unknown>)[key];
    return typeof fn === 'function'
        ? (fn as (messageParams?: MessageParams) => string)(params)
        : fallback;
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

const findResultDescription = (
    template: OBv3CredentialTemplate,
    index = 0
): ResultDescriptionTemplate | undefined => {
    const result = template.credentialSubject.result?.[index];
    const descriptions = template.credentialSubject.achievement.resultDescription;
    const descriptionId = result?.resultDescription?.value;

    const linkedDescription = descriptionId
        ? descriptions?.find(description => description.id === descriptionId)
        : undefined;

    if (index > 0) return linkedDescription;
    return (
        linkedDescription ??
        descriptions?.find(description => description.name?.value === DEFAULT_RESULT_NAME) ??
        (!result && descriptions?.length === 1 ? descriptions[0] : undefined)
    );
};

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

export const readResultState = (template: OBv3CredentialTemplate, index = 0): ResultState => {
    const result = template.credentialSubject.result?.[index];
    const desc = findResultDescription(template, index);

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
        name?: TemplateFieldValue;
        valueMin?: TemplateFieldValue;
        valueMax?: TemplateFieldValue;
        rubricCriterionLevel?: RubricCriterionLevelTemplate[];
        alignment?: AlignmentTemplate[];
    }
): ResultDescriptionTemplate => ({
    id,
    name: config.name ?? staticField(DEFAULT_RESULT_NAME),
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
    field?: TemplateFieldValue,
    achievedLevel?: TemplateFieldValue
): ResultTemplate => ({
    id: `result_${id}`,
    resultDescription: staticField(id),
    ...(field ? (resultType === 'Status' ? { status: field } : { value: field }) : {}),
    ...(resultType === 'RubricCriterionLevel' && achievedLevel ? { achievedLevel } : {}),
});

export interface ResultUpdate {
    name?: TemplateFieldValue;
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
    next: ResultUpdate,
    index = 0
): OBv3CredentialTemplate => {
    const { resultType } = next;
    const field = toField(next.value) ?? staticField('');
    const achievement = template.credentialSubject.achievement;
    const existingDescription = findResultDescription(template, index);
    const otherResults = (template.credentialSubject.result ?? []).filter(
        (_, resultIndex) => resultIndex !== index
    );
    const sharedDescription = Boolean(
        existingDescription &&
        otherResults.some(result => result.resultDescription?.value === existingDescription.id)
    );
    const sameType = existingDescription?.resultType?.value === resultType;
    const valueMin =
        toField(next.valueMin) ?? (sameType ? existingDescription?.valueMin : undefined);
    const valueMax =
        toField(next.valueMax) ?? (sameType ? existingDescription?.valueMax : undefined);
    const rubricCriterionLevel =
        next.rubricCriterionLevel ??
        (sameType ? existingDescription?.rubricCriterionLevel : undefined);
    // Alignments describe the result itself, so preserve them across result-type changes.
    const alignment = next.alignment ?? existingDescription?.alignment;
    const achievedLevel = toField(next.achievedLevel);
    const hasCustomBounds =
        resultType !== 'Percent' && Boolean(valueMin?.value.trim() || valueMax?.value.trim());
    const hasDescriptionConfiguration = Boolean(
        hasCustomBounds || rubricCriterionLevel?.length || alignment?.length
    );
    const hasValue = field.isDynamic || Boolean(field.value.trim());
    const hasAchievedLevel =
        resultType === 'RubricCriterionLevel' &&
        Boolean(achievedLevel?.isDynamic || achievedLevel?.value.trim());
    const hasResult = hasValue || hasAchievedLevel;
    const preserveEmptyRubricDescription = resultType === 'RubricCriterionLevel' && sameType;

    if (!hasResult && !hasDescriptionConfiguration && !preserveEmptyRubricDescription) {
        const remainingDescriptions = achievement.resultDescription?.filter(
            description => description !== existingDescription || sharedDescription
        );
        return {
            ...template,
            credentialSubject: {
                ...template.credentialSubject,
                result: otherResults.length ? otherResults : undefined,
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

    const id =
        existingDescription && !sharedDescription
            ? existingDescription.id
            : newResultDescriptionId();
    const otherDescriptions =
        achievement.resultDescription?.filter(
            description => description !== existingDescription || sharedDescription
        ) ?? [];

    return {
        ...template,
        credentialSubject: {
            ...template.credentialSubject,
            result: hasResult
                ? [
                      ...(template.credentialSubject.result ?? []).slice(0, index),
                      buildResult(
                          id,
                          resultType,
                          hasValue ? field : undefined,
                          hasAchievedLevel ? achievedLevel : undefined
                      ),
                      ...(template.credentialSubject.result ?? []).slice(index + 1),
                  ]
                : otherResults.length
                  ? otherResults
                  : undefined,
            achievement: {
                ...achievement,
                resultDescription: [
                    ...otherDescriptions,
                    buildResultDescription(id, resultType, {
                        name: next.name ?? existingDescription?.name,
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

const PROFILE_RESULT_TYPES = new Set<ResultType>([
    'Percent',
    'RawScore',
    'RubricCriterionLevel',
    'GradePointAverage',
]);

const resolveFieldValue = (
    field: TemplateFieldValue | undefined,
    variableValues?: Record<string, string>
): string | undefined => {
    if (!field) return '';
    if (!field.isDynamic) return field.value.trim();
    if (!variableValues) return undefined;
    return variableValues[field.variableName]?.trim() ?? '';
};

const getSingleResultValidationError = (
    template: OBv3CredentialTemplate,
    variableValues: Record<string, string> | undefined,
    index: number,
    reportField?: (field: TemplateFieldValue) => void
): string | null => {
    const state = readResultState(template, index);
    const result = template.credentialSubject.result?.[index];
    const description = state.resultDescription;

    if ((!result && !description) || state.isLegacyUntyped) return null;

    for (const alignment of state.alignment ?? []) {
        const targetName = resolveFieldValue(alignment.targetName, variableValues);
        const targetUrl = resolveFieldValue(alignment.targetUrl, variableValues);

        if (targetName === '' || targetUrl === '') {
            if (targetName === '') reportField?.(alignment.targetName);
            if (targetUrl === '') reportField?.(alignment.targetUrl);
            return msg(
                'issueFlow.result.validation.alignmentNameUrl',
                'Add a name and URL for each result alignment.'
            );
        }
        if (targetUrl !== undefined && !/^https?:\/\//i.test(targetUrl)) {
            reportField?.(alignment.targetUrl);
            return msg(
                'issueFlow.result.validation.alignmentUrl',
                'Enter a valid URL for each result alignment.'
            );
        }
    }

    if (state.resultType === 'RubricCriterionLevel') {
        const levels = state.rubricCriterionLevel ?? [];
        if (levels.length === 0) {
            return msg(
                'issueFlow.result.validation.addRubricLevel',
                'Add at least one rubric level.'
            );
        }
        const ids = new Set<string>();
        for (const level of levels) {
            const name = resolveFieldValue(level.name, variableValues);
            const rubricLevel = resolveFieldValue(level.level, variableValues);
            const points = resolveFieldValue(level.points, variableValues);

            if (!level.id.trim() || name === '' || rubricLevel === '' || points === '') {
                if (name === '' && level.name) reportField?.(level.name);
                if (rubricLevel === '' && level.level) reportField?.(level.level);
                if (points === '' && level.points) reportField?.(level.points);
                return msg(
                    'issueFlow.result.validation.completeRubricLevel',
                    'Complete the id, name, level, and points for each rubric level.'
                );
            }
            if (ids.has(level.id)) {
                return msg(
                    'issueFlow.result.validation.uniqueRubricId',
                    'Use a unique id for each rubric level.'
                );
            }
            ids.add(level.id);
            if (points !== undefined && !Number.isFinite(Number(points))) {
                if (level.points) reportField?.(level.points);
                return msg(
                    'issueFlow.result.validation.numericRubricPoints',
                    'Enter numeric points for each rubric level.'
                );
            }
        }
        const achievedLevel = resolveFieldValue(state.achievedLevelField, variableValues);
        if (result && achievedLevel === '') {
            if (state.achievedLevelField) reportField?.(state.achievedLevelField);
            return msg(
                'issueFlow.result.validation.chooseAchievedLevel',
                'Choose an achieved rubric level.'
            );
        }
        if (achievedLevel !== undefined && achievedLevel && !ids.has(achievedLevel)) {
            if (state.achievedLevelField) reportField?.(state.achievedLevelField);
            return msg(
                'issueFlow.result.validation.chooseDeclaredRubricLevel',
                'Choose one of the declared rubric levels.'
            );
        }
    }

    if (!result) return null;

    const minimum = state.valueMin ? Number(state.valueMin) : undefined;
    const maximum = state.valueMax ? Number(state.valueMax) : undefined;
    if (
        (state.valueMin && !Number.isFinite(minimum)) ||
        (state.valueMax && !Number.isFinite(maximum))
    ) {
        return msg(
            'issueFlow.result.validation.numericBounds',
            'Use numeric minimum and maximum values.'
        );
    }
    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
        return msg(
            'issueFlow.result.validation.minimumExceedsMaximum',
            'The minimum result cannot exceed the maximum result.'
        );
    }

    if (!PROFILE_RESULT_TYPES.has(state.resultType)) return null;

    if (
        state.resultType === 'RubricCriterionLevel' &&
        !state.valueField &&
        state.achievedLevelField
    ) {
        return null;
    }

    const value = resolveFieldValue(state.valueField, variableValues);
    if (value === undefined) return null;
    let numericValue: number;
    try {
        numericValue = parseCredentialNumber(value);
    } catch {
        if (state.valueField) reportField?.(state.valueField);
        return msg('issueFlow.result.validation.numericResult', 'Enter a numeric result.');
    }
    if (
        (minimum !== undefined && numericValue < minimum) ||
        (maximum !== undefined && numericValue > maximum)
    ) {
        if (state.valueField) reportField?.(state.valueField);
        if (minimum !== undefined && maximum !== undefined) {
            return msg(
                'issueFlow.result.validation.resultRange',
                `Enter a result from ${state.valueMin} to ${state.valueMax}.`,
                { minimum: state.valueMin, maximum: state.valueMax }
            );
        }
        if (minimum !== undefined) {
            return msg(
                'issueFlow.result.validation.resultMinimum',
                `Enter a result of at least ${state.valueMin}.`,
                { minimum: state.valueMin }
            );
        }
        return msg(
            'issueFlow.result.validation.resultMaximum',
            `Enter a result no higher than ${state.valueMax}.`,
            { maximum: state.valueMax }
        );
    }

    return null;
};

/** Validate every linked result, or a selected result; optionally identify its invalid fields. */
export const getResultValidationError = (
    template: OBv3CredentialTemplate,
    values?: Record<string, string>,
    index?: number,
    reportField?: (field: TemplateFieldValue) => void
): string | null => {
    if (index !== undefined)
        return getSingleResultValidationError(template, values, index, reportField);
    for (
        let current = 0;
        current < Math.max(1, template.credentialSubject.result?.length ?? 0);
        current++
    ) {
        const error = getSingleResultValidationError(template, values, current, reportField);
        if (error) return error;
    }
    return null;
};
