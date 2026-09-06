import React, { useEffect, useState } from 'react';
import { AlertCircle, Link, Plus, Trash2, Variable, X } from 'lucide-react';

import {
    staticField,
    dynamicField,
    type AlignmentTemplate,
    type OBv3CredentialTemplate,
    type RubricCriterionLevelTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import {
    RESULT_TYPE_OPTIONS,
    RESULT_STATUS_VALUES,
    getResultValidationError,
    readResultState,
    writeResult,
    resultTypeLabel,
    resultTypePlaceholder,
    resultStatusLabel,
    type ResultType,
    type ResultUpdate,
} from './resultField';
import * as m from '../../../paraglide/messages.js';

interface ResultFieldEditorProps {
    template: OBv3CredentialTemplate;
    onChangeTemplate: (template: OBv3CredentialTemplate) => void;
    canMakeDynamic: boolean;
}

const RESULT_VARIABLE_NAME = 'grade';

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';
const createRubricLevel = (): RubricCriterionLevelTemplate => ({
    id: `urn:uuid:${crypto.randomUUID()}`,
    name: staticField(''),
    level: staticField(''),
    points: staticField(''),
});

const createResultAlignment = (): AlignmentTemplate => ({
    id: `resultAlignment_${crypto.randomUUID()}`,
    targetName: staticField(''),
    targetUrl: staticField(''),
    targetFramework: staticField('Credential Engine Registry'),
    targetType: staticField('CTDL'),
});

export const ResultFieldEditor: React.FC<ResultFieldEditorProps> = ({
    template,
    onChangeTemplate,
    canMakeDynamic,
}) => {
    const state = readResultState(template);
    const isDynamic = Boolean(state.valueField?.isDynamic);
    const validationError = getResultValidationError(template);

    // Keep an empty selection locally until there is enough result data to store.
    const [selectedType, setSelectedType] = useState<ResultType>(state.resultType);

    const hasStoredResult = Boolean(
        template.credentialSubject.result?.[0] || state.resultDescription
    );
    useEffect(() => {
        if (hasStoredResult && !state.isLegacyUntyped) setSelectedType(state.resultType);
    }, [hasStoredResult, state.isLegacyUntyped, state.resultType]);

    const activeOption =
        RESULT_TYPE_OPTIONS.find(option => option.value === selectedType) ?? RESULT_TYPE_OPTIONS[0];

    const currentUpdate = (patch: Partial<ResultUpdate>): ResultUpdate => ({
        resultType: selectedType,
        value: state.valueField ?? state.value,
        valueMin: state.valueMin,
        valueMax: state.valueMax,
        rubricCriterionLevel: state.rubricCriterionLevel,
        alignment: state.alignment,
        achievedLevel: state.achievedLevelField ?? state.achievedLevel,
        ...patch,
    });

    const commitUpdate = (patch: Partial<ResultUpdate>) => {
        onChangeTemplate(writeResult(template, currentUpdate(patch)));
    };

    const setResultType = (resultType: ResultType) => {
        setSelectedType(resultType);
        const value = state.valueField?.isDynamic ? state.valueField : '';
        const rubricCriterionLevel =
            resultType === 'RubricCriterionLevel'
                ? state.rubricCriterionLevel?.length
                    ? state.rubricCriterionLevel
                    : [createRubricLevel()]
                : undefined;
        onChangeTemplate(
            writeResult(template, {
                ...currentUpdate({
                    resultType,
                    value,
                    valueMin: '',
                    valueMax: '',
                    rubricCriterionLevel,
                    achievedLevel: '',
                }),
            })
        );
    };

    const setValue = (value: string) => commitUpdate({ value });

    const makeDynamic = () =>
        commitUpdate({ value: dynamicField(RESULT_VARIABLE_NAME), achievedLevel: '' });

    const makeStatic = () => commitUpdate({ value: staticField('') });

    const updateRubricLevel = (index: number, patch: Partial<RubricCriterionLevelTemplate>) => {
        const levels = (state.rubricCriterionLevel ?? []).map((level, levelIndex) =>
            levelIndex === index ? { ...level, ...patch } : level
        );
        const previousId = state.rubricCriterionLevel?.[index]?.id;
        const achievedLevel =
            patch.id !== undefined && state.achievedLevel === previousId
                ? patch.id
                : state.achievedLevel;
        commitUpdate({ rubricCriterionLevel: levels, achievedLevel });
    };

    const removeRubricLevel = (index: number) => {
        const removedId = state.rubricCriterionLevel?.[index]?.id;
        commitUpdate({
            rubricCriterionLevel: (state.rubricCriterionLevel ?? []).filter(
                (_, levelIndex) => levelIndex !== index
            ),
            achievedLevel: state.achievedLevel === removedId ? '' : state.achievedLevel,
        });
    };

    const updateAlignment = (index: number, patch: Partial<AlignmentTemplate>) => {
        commitUpdate({
            alignment: (state.alignment ?? []).map((alignment, alignmentIndex) =>
                alignmentIndex === index ? { ...alignment, ...patch } : alignment
            ),
        });
    };

    return (
        <div className="sm:col-span-2 space-y-3">
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-grayscale-700">
                        {m['issueFlow.fields.gradeOrResult']()}
                    </label>
                    {isDynamic ? (
                        <button
                            type="button"
                            onClick={makeStatic}
                            className="flex items-center gap-1 text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                        >
                            <X className="w-3 h-3" />
                            {m['issueFlow.fields.useFixed']()}
                        </button>
                    ) : canMakeDynamic ? (
                        <button
                            type="button"
                            onClick={makeDynamic}
                            className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                        >
                            <Variable className="w-3 h-3" />
                            {m['issueFlow.fields.personalize']()}
                        </button>
                    ) : null}
                </div>
                <p className="text-xs text-grayscale-500 mb-2">Skill-aligned result types</p>
                <div className="flex flex-wrap gap-2">
                    {RESULT_TYPE_OPTIONS.filter(option => option.profileSupported).map(option => {
                        const active = option.value === selectedType;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setResultType(option.value)}
                                aria-pressed={active}
                                className={`py-2 px-3 rounded-full text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-grayscale-900 text-white'
                                        : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                }`}
                            >
                                {resultTypeLabel(option)}
                            </button>
                        );
                    })}
                </div>
                <details className="mt-3" open={!activeOption.profileSupported}>
                    <summary className="text-xs font-medium text-grayscale-600 cursor-pointer">
                        Other result types
                    </summary>
                    <p className="text-xs text-amber-700 leading-relaxed mt-2">
                        These types aren’t included in the Open Skill Alignment profile.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {RESULT_TYPE_OPTIONS.filter(option => !option.profileSupported).map(
                            option => {
                                const active = option.value === selectedType;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setResultType(option.value)}
                                        aria-pressed={active}
                                        className={`py-2 px-3 rounded-full text-sm font-medium transition-colors ${
                                            active
                                                ? 'bg-grayscale-900 text-white'
                                                : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                        }`}
                                    >
                                        {resultTypeLabel(option)}
                                    </button>
                                );
                            }
                        )}
                    </div>
                </details>
            </div>

            {isDynamic ? (
                <div className="flex items-center gap-2 py-3 px-4 border border-dashed border-emerald-300 rounded-xl bg-emerald-50/50">
                    <Variable className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-medium text-emerald-800">{`{{${RESULT_VARIABLE_NAME}}}`}</span>
                    <span className="ml-auto text-xs text-grayscale-500">
                        {m['issueFlow.fields.setPerRecipient']()}
                    </span>
                </div>
            ) : selectedType === 'Status' ? (
                <select
                    value={state.value}
                    onChange={event => setValue(event.target.value)}
                    className={INPUT_CLASS}
                >
                    <option value="">{m['issueFlow.fields.selectStatus']()}</option>
                    {RESULT_STATUS_VALUES.map(status => (
                        <option key={status} value={status}>
                            {resultStatusLabel(status)}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type="text"
                    inputMode={activeOption.profileSupported ? 'decimal' : undefined}
                    value={state.value}
                    onChange={event => setValue(event.target.value)}
                    placeholder={resultTypePlaceholder(activeOption)}
                    aria-invalid={Boolean(validationError)}
                    className={INPUT_CLASS}
                />
            )}

            {selectedType === 'Percent' && (
                <p className="text-xs text-grayscale-500">Percent results use a 0–100 range.</p>
            )}

            {selectedType === 'RawScore' && (
                <div className="grid grid-cols-2 gap-3">
                    <label className={LABEL_CLASS}>
                        Minimum
                        <input
                            type="text"
                            inputMode="decimal"
                            value={state.valueMin}
                            onChange={event => commitUpdate({ valueMin: event.target.value })}
                            placeholder="e.g. 0"
                            className={`${INPUT_CLASS} mt-1.5`}
                        />
                    </label>
                    <label className={LABEL_CLASS}>
                        Maximum
                        <input
                            type="text"
                            inputMode="decimal"
                            value={state.valueMax}
                            onChange={event => commitUpdate({ valueMax: event.target.value })}
                            placeholder="e.g. 800"
                            className={`${INPUT_CLASS} mt-1.5`}
                        />
                    </label>
                </div>
            )}

            {selectedType === 'RubricCriterionLevel' && (
                <div className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4 space-y-4">
                    <div>
                        <p className="text-sm font-medium text-grayscale-900">Rubric levels</p>
                        <p className="text-xs text-grayscale-500 mt-1">
                            Define each level before choosing the one achieved.
                        </p>
                    </div>
                    {(state.rubricCriterionLevel ?? []).map((level, index) => (
                        <div
                            key={`${index}-${level.id}`}
                            className="rounded-xl border border-grayscale-200 bg-white p-3 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-grayscale-700">
                                    Level {index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeRubricLevel(index)}
                                    aria-label={`Remove rubric level ${index + 1}`}
                                    className="p-2 rounded-full text-grayscale-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <label className={LABEL_CLASS}>
                                ID
                                <input
                                    type="text"
                                    value={level.id}
                                    readOnly
                                    aria-readonly="true"
                                    className={`${INPUT_CLASS} mt-1.5`}
                                />
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <label className={LABEL_CLASS}>
                                    Name
                                    <input
                                        type="text"
                                        value={level.name.value}
                                        onChange={event =>
                                            updateRubricLevel(index, {
                                                name: staticField(event.target.value),
                                            })
                                        }
                                        placeholder="Proficient"
                                        className={`${INPUT_CLASS} mt-1.5`}
                                    />
                                </label>
                                <label className={LABEL_CLASS}>
                                    Level
                                    <input
                                        type="text"
                                        value={level.level.value}
                                        onChange={event =>
                                            updateRubricLevel(index, {
                                                level: staticField(event.target.value),
                                            })
                                        }
                                        placeholder="3"
                                        className={`${INPUT_CLASS} mt-1.5`}
                                    />
                                </label>
                                <label className={LABEL_CLASS}>
                                    Points
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={level.points.value}
                                        onChange={event =>
                                            updateRubricLevel(index, {
                                                points: staticField(event.target.value),
                                            })
                                        }
                                        placeholder="3"
                                        className={`${INPUT_CLASS} mt-1.5`}
                                    />
                                </label>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() =>
                            commitUpdate({
                                rubricCriterionLevel: [
                                    ...(state.rubricCriterionLevel ?? []),
                                    createRubricLevel(),
                                ],
                            })
                        }
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 font-medium text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Level
                    </button>
                    <label className={LABEL_CLASS}>
                        Achieved level
                        <select
                            value={state.achievedLevel}
                            onChange={event => commitUpdate({ achievedLevel: event.target.value })}
                            disabled={!state.valueField}
                            className={`${INPUT_CLASS} mt-1.5`}
                        >
                            <option value="">Choose a level…</option>
                            {(state.rubricCriterionLevel ?? [])
                                .filter(level => level.id.trim())
                                .map(level => (
                                    <option key={level.id} value={level.id}>
                                        {level.name.value || level.level.value || level.id}
                                    </option>
                                ))}
                        </select>
                    </label>
                </div>
            )}

            <details
                className="rounded-2xl border border-grayscale-200 p-4"
                open={(state.alignment?.length ?? 0) > 0}
            >
                <summary className="flex items-start gap-2 cursor-pointer">
                    <Link className="w-4 h-4 text-grayscale-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-grayscale-900">Result alignments</p>
                        <p className="text-xs text-grayscale-500 mt-1">
                            Link this result to a CTDL resource in the Credential Registry.
                        </p>
                    </div>
                </summary>
                <div className="space-y-3 mt-4">
                    {(state.alignment ?? []).map((alignment, index) => (
                        <div
                            key={alignment.id}
                            className="rounded-xl border border-grayscale-200 bg-grayscale-10 p-3 space-y-3"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-grayscale-700">
                                    Alignment {index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        commitUpdate({
                                            alignment: (state.alignment ?? []).filter(
                                                (_, alignmentIndex) => alignmentIndex !== index
                                            ),
                                        })
                                    }
                                    aria-label={`Remove result alignment ${index + 1}`}
                                    className="p-2 rounded-full text-grayscale-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <label className={LABEL_CLASS}>
                                Name
                                <input
                                    type="text"
                                    value={alignment.targetName.value}
                                    onChange={event =>
                                        updateAlignment(index, {
                                            targetName: staticField(event.target.value),
                                        })
                                    }
                                    placeholder="Skill or competency"
                                    className={`${INPUT_CLASS} mt-1.5`}
                                />
                            </label>
                            <label className={LABEL_CLASS}>
                                CTDL resource URL
                                <input
                                    type="url"
                                    value={alignment.targetUrl.value}
                                    onChange={event =>
                                        updateAlignment(index, {
                                            targetUrl: staticField(event.target.value),
                                        })
                                    }
                                    placeholder="https://credentialengineregistry.org/resources/..."
                                    className={`${INPUT_CLASS} mt-1.5`}
                                />
                            </label>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() =>
                            commitUpdate({
                                alignment: [...(state.alignment ?? []), createResultAlignment()],
                            })
                        }
                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 font-medium text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Result Alignment
                    </button>
                </div>
            </details>

            {validationError && (
                <div
                    role="alert"
                    className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl"
                >
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-red-700 leading-relaxed">{validationError}</span>
                </div>
            )}

            {state.isLegacyUntyped && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-amber-700 leading-relaxed">
                        {m['issueFlow.fields.pickGradeType']()}
                    </span>
                </div>
            )}
        </div>
    );
};
