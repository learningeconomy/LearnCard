import React from 'react';
import { Variable, X } from 'lucide-react';

import {
    staticField,
    dynamicField,
    type TemplateFieldValue,
} from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';

const INPUT_CLASS =
    'w-full py-3 px-4 border border-grayscale-300 rounded-xl text-base text-grayscale-900 placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white transition-all';

interface TemplatableFieldProps {
    label: string;
    field?: TemplateFieldValue;
    variableName: string;
    onChange: (field: TemplateFieldValue) => void;
    canMakeDynamic: boolean;
    variant?: 'input' | 'textarea' | 'number';
    rows?: number;
    placeholder?: string;
    errorText?: string;
    onBlur?: () => void;
}

export const TemplatableField: React.FC<TemplatableFieldProps> = ({
    label,
    field,
    variableName,
    onChange,
    canMakeDynamic,
    variant = 'input',
    rows = 3,
    placeholder,
    errorText,
    onBlur,
}) => {
    const isDynamic = Boolean(field?.isDynamic);
    const value = field?.value ?? '';

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-grayscale-700">{label}</label>
                {isDynamic ? (
                    <button
                        type="button"
                        onClick={() => onChange(staticField(''))}
                        className="flex items-center gap-1 text-xs font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Use a fixed value
                    </button>
                ) : canMakeDynamic ? (
                    <button
                        type="button"
                        onClick={() => onChange(dynamicField(variableName))}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        <Variable className="w-3 h-3" />
                        Personalize per recipient
                    </button>
                ) : null}
            </div>

            {isDynamic ? (
                <div className="flex items-center gap-2 py-3 px-4 border border-dashed border-emerald-300 rounded-xl bg-emerald-50/50">
                    <Variable className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-medium text-emerald-800">{`{{${variableName}}}`}</span>
                    <span className="ml-auto text-xs text-grayscale-500">
                        Set per recipient below
                    </span>
                </div>
            ) : variant === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={e => onChange(staticField(e.target.value))}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    rows={rows}
                    className={`${INPUT_CLASS} resize-none`}
                />
            ) : (
                <input
                    type={variant === 'number' ? 'number' : 'text'}
                    value={value}
                    onChange={e => onChange(staticField(e.target.value))}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className={`${INPUT_CLASS} ${
                        errorText ? '!border-red-400 focus:!ring-red-500' : ''
                    }`}
                />
            )}

            {errorText && !isDynamic && <p className="mt-1.5 text-xs text-red-600">{errorText}</p>}
        </div>
    );
};
