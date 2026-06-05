import React from 'react';
import { AlertCircle } from 'lucide-react';

import type { OBv3CredentialTemplate } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
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
}

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';

export const ResultFieldEditor: React.FC<ResultFieldEditorProps> = ({
    template,
    onChangeTemplate,
}) => {
    const state = readResultState(template);
    const activeOption =
        RESULT_TYPE_OPTIONS.find(o => o.value === state.resultType) ?? RESULT_TYPE_OPTIONS[0];

    const setResultType = (resultType: ResultType) =>
        onChangeTemplate(writeResult(template, { resultType, value: '' }));

    const setValue = (value: string) =>
        onChangeTemplate(writeResult(template, { resultType: state.resultType, value }));

    return (
        <div className="sm:col-span-2 space-y-3">
            <div>
                <label className={LABEL_CLASS}>Grade or result</label>
                <div className="flex flex-wrap gap-2">
                    {RESULT_TYPE_OPTIONS.map(option => {
                        const active = option.value === state.resultType;
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

            {state.resultType === 'Status' ? (
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
