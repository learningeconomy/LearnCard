import React from 'react';
import { Variable } from 'lucide-react';

import { humanizeVariable, inferVariableInputType } from './variableSubstitution';
import { RecipientMode, Recipient, recipientKey, recipientLabel } from './recipientTypes';

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';
const LABEL_CLASS = 'block text-xs font-medium text-grayscale-700 mb-1.5';
const CARD_CLASS = 'bg-white border border-grayscale-200 rounded-[20px] p-5';

export type VariableScope = 'shared' | 'perRecipient';

interface DynamicFieldsSectionProps {
    variables: string[];
    recipientMode: RecipientMode;
    recipients: Recipient[];
    scope: VariableScope;
    onScopeChange: (scope: VariableScope) => void;
    sharedValues: Record<string, string>;
    onSharedChange: (name: string, value: string) => void;
    recipientValues: Record<string, Record<string, string>>;
    onRecipientChange: (recipientKey: string, name: string, value: string) => void;
}

const VariableInputs: React.FC<{
    variables: string[];
    values: Record<string, string>;
    idPrefix: string;
    onChange: (name: string, value: string) => void;
}> = ({ variables, values, idPrefix, onChange }) => (
    <div className="space-y-4">
        {variables.map(name => {
            const type = inferVariableInputType(name);
            return (
                <div key={name}>
                    <label className={LABEL_CLASS} htmlFor={`${idPrefix}-${name}`}>
                        {humanizeVariable(name)}
                    </label>
                    <input
                        id={`${idPrefix}-${name}`}
                        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                        inputMode={type === 'url' ? 'url' : undefined}
                        value={values[name] ?? ''}
                        onChange={e => onChange(name, e.target.value)}
                        placeholder={`{{${name}}}`}
                        className={INPUT_CLASS}
                    />
                </div>
            );
        })}
    </div>
);

export const DynamicFieldsSection: React.FC<DynamicFieldsSectionProps> = ({
    variables,
    recipientMode,
    recipients,
    scope,
    onScopeChange,
    sharedValues,
    onSharedChange,
    recipientValues,
    onRecipientChange,
}) => {
    if (variables.length === 0) return null;

    const canCustomizePerRecipient = recipientMode === 'people' && recipients.length > 1;
    const perRecipient = canCustomizePerRecipient && scope === 'perRecipient';

    return (
        <section className={`${CARD_CLASS} space-y-4 animate-fade-in-up`}>
            <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <Variable className="w-4 h-4 text-emerald-600" />
                </span>
                <div>
                    <h3 className="text-base font-semibold text-grayscale-900">
                        Fill in the details
                    </h3>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        This credential has placeholders. Give each one a value before issuing.
                    </p>
                </div>
            </div>

            {canCustomizePerRecipient && (
                <div className="flex gap-1 p-1 rounded-full bg-grayscale-100">
                    <button
                        type="button"
                        onClick={() => onScopeChange('shared')}
                        className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-colors ${
                            scope === 'shared'
                                ? 'bg-grayscale-900 text-white'
                                : 'text-grayscale-700 hover:text-grayscale-900'
                        }`}
                    >
                        Same for everyone
                    </button>
                    <button
                        type="button"
                        onClick={() => onScopeChange('perRecipient')}
                        className={`flex-1 py-2 px-3 rounded-full text-sm font-medium transition-colors ${
                            scope === 'perRecipient'
                                ? 'bg-grayscale-900 text-white'
                                : 'text-grayscale-700 hover:text-grayscale-900'
                        }`}
                    >
                        Per recipient
                    </button>
                </div>
            )}

            {perRecipient ? (
                <div className="space-y-4">
                    {recipients.map(recipient => {
                        const key = recipientKey(recipient);
                        return (
                            <div
                                key={key}
                                className="rounded-2xl border border-grayscale-200 bg-grayscale-10 p-4 space-y-4"
                            >
                                <p className="text-sm font-semibold text-grayscale-900">
                                    {recipientLabel(recipient)}
                                </p>
                                <VariableInputs
                                    variables={variables}
                                    values={recipientValues[key] ?? {}}
                                    idPrefix={`var-${key}`}
                                    onChange={(name, value) => onRecipientChange(key, name, value)}
                                />
                            </div>
                        );
                    })}
                </div>
            ) : (
                <VariableInputs
                    variables={variables}
                    values={sharedValues}
                    idPrefix="var"
                    onChange={onSharedChange}
                />
            )}
        </section>
    );
};
