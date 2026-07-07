import React, { useEffect, useState } from 'react';
import { AlertCircle, Variable, X } from 'lucide-react';

import {
    staticField,
    dynamicField,
    type OBv3CredentialTemplate,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import {
    RESULT_TYPE_OPTIONS,
    RESULT_STATUS_VALUES,
    readResultState,
    writeResult,
    type ResultType,
} from './resultField';

interface ResultFieldEditorProps {
    template: OBv3CredentialTemplate;
    onChangeTemplate: (template: OBv3CredentialTemplate) => void;
    canMakeDynamic: boolean;
}

const RESULT_VARIABLE_NAME = 'grade';

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';

export const ResultFieldEditor: React.FC<ResultFieldEditorProps> = ({
    template,
    onChangeTemplate,
    canMakeDynamic,
}) => {
    const state = readResultState(template);
    const isDynamic = Boolean(state.valueField?.isDynamic);

    // The chosen grade type is held locally so it sticks before a value is
    // entered — `writeResult` drops the result (and its type) while the value
    // is empty, so the template can't remember the selection on its own.
    const [selectedType, setSelectedType] = useState<ResultType>(state.resultType);

    const hasStoredResult = Boolean(template.credentialSubject.result?.[0]);
    useEffect(() => {
        if (hasStoredResult && !state.isLegacyUntyped) setSelectedType(state.resultType);
    }, [hasStoredResult, state.isLegacyUntyped, state.resultType]);

    const activeOption =
        RESULT_TYPE_OPTIONS.find(o => o.value === selectedType) ?? RESULT_TYPE_OPTIONS[0];

    const setResultType = (resultType: ResultType) => {
        setSelectedType(resultType);
        // Preserve a dynamic placeholder across type changes; otherwise clear any
        // in-progress value (e.g. "A-" isn't a valid GPA) so it's re-entered fresh.
        if (state.valueField?.isDynamic) {
            onChangeTemplate(writeResult(template, { resultType, value: state.valueField }));
        } else if (state.value.trim()) {
            onChangeTemplate(writeResult(template, { resultType, value: '' }));
        }
    };

    const setValue = (value: string) =>
        onChangeTemplate(writeResult(template, { resultType: selectedType, value }));

    const makeDynamic = () =>
        onChangeTemplate(
            writeResult(template, {
                resultType: selectedType,
                value: dynamicField(RESULT_VARIABLE_NAME),
            })
        );

    const makeStatic = () =>
        onChangeTemplate(
            writeResult(template, { resultType: selectedType, value: staticField('') })
        );

    return (
        <div className="sm:col-span-2 space-y-3">
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-grayscale-700">
                        Grade or result
                    </label>
                    {isDynamic ? (
                        <button
                            type="button"
                            onClick={makeStatic}
                            className="flex items-center gap-1 text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                        >
                            <X className="w-3 h-3" />
                            Use a fixed value
                        </button>
                    ) : canMakeDynamic ? (
                        <button
                            type="button"
                            onClick={makeDynamic}
                            className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                        >
                            <Variable className="w-3 h-3" />
                            Personalize per recipient
                        </button>
                    ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                    {RESULT_TYPE_OPTIONS.map(option => {
                        const active = option.value === selectedType;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setResultType(option.value)}
                                className={`py-2 px-3 rounded-full text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-grayscale-900 text-white'
                                        : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {isDynamic ? (
                <div className="flex items-center gap-2 py-3 px-4 border border-dashed border-emerald-300 rounded-xl bg-emerald-50/50">
                    <Variable className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-medium text-emerald-800">{`{{${RESULT_VARIABLE_NAME}}}`}</span>
                    <span className="ml-auto text-xs text-grayscale-500">
                        Set per recipient below
                    </span>
                </div>
            ) : selectedType === 'Status' ? (
                <select
                    value={state.value}
                    onChange={e => setValue(e.target.value)}
                    className={INPUT_CLASS}
                >
                    <option value="">Select a status…</option>
                    {RESULT_STATUS_VALUES.map(status => (
                        <option key={status} value={status}>
                            {status.replace(/([A-Z])/g, ' $1').trim()}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type="text"
                    value={state.value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={activeOption.placeholder}
                    className={INPUT_CLASS}
                />
            )}

            {state.isLegacyUntyped && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-xs text-amber-700 leading-relaxed">
                        Pick a grade type above so this result is saved in a standard format.
                    </span>
                </div>
            )}
        </div>
    );
};
