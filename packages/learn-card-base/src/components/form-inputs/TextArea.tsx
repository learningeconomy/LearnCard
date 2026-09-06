import React from 'react';
import { IonTextarea } from '@ionic/react';

type TextAreaProps = {
    value: string | null | undefined;
    onChange: (value: string | null | undefined) => void;
    id?: string;
    label?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    error?: string;
    errorId?: string;
    placeholder?: string;
    disabled?: boolean;
    debounce?: number;
    maxLength?: number;
    rows?: number;
    autoGrow?: boolean;
    className?: string;
    inputClassName?: string;
    autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
    onFocus?: () => void;
    onBlur?: () => void;
};

const TextArea: React.FC<TextAreaProps> = ({
    value,
    onChange,
    id,
    label,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    error,
    errorId,
    placeholder,
    disabled = false,
    debounce,
    maxLength,
    rows = 3,
    autoGrow = false,
    className = '',
    inputClassName = '',
    autocapitalize,
    onFocus,
    onBlur,
}) => {
    const generatedId = React.useId();
    const inputId = id ?? `text-area-${generatedId}`;
    const resolvedErrorId = errorId ?? `${inputId}-error`;
    const describedBy = [ariaDescribedBy, error ? resolvedErrorId : undefined]
        .filter(Boolean)
        .join(' ');

    return (
        <div>
            {label && (
                <label
                    htmlFor={inputId}
                    className="mb-1.5 block text-xs font-medium text-grayscale-700"
                >
                    {label}
                </label>
            )}
            <div
                className={`relative flex items-center rounded-[10px] bg-grayscale-100 focus-within:ring-2 focus-within:ring-emerald-500 ${className}`}
            >
                <IonTextarea
                    id={inputId}
                    aria-label={ariaLabel ?? label ?? placeholder}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy || undefined}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    debounce={debounce}
                    maxlength={maxLength}
                    rows={rows}
                    autoGrow={autoGrow}
                    autocapitalize={autocapitalize}
                    onIonInput={e => onChange(e.detail.value)}
                    onIonFocus={onFocus}
                    onIonBlur={onBlur}
                    className={`text-grayscale-900 font-poppins text-[14px] leading-[130%] w-full !px-[15px] ${inputClassName}`}
                />
            </div>
            {error && (
                <p id={resolvedErrorId} className="mt-1.5 text-xs text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
};

export default TextArea;
