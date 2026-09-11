import React from 'react';
import { IonInput } from '@ionic/react';

type TextInputProps = {
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    id?: string;
    label?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    error?: string;
    errorId?: string;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
    disabled?: boolean;
    debounce?: number;
    maxLength?: number;
    autoFocus?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    startButton?: React.ReactNode;
    endButton?: React.ReactNode;
    className?: string;
    inputClassName?: string;
    autocapitalize?: 'off' | 'none' | 'on' | 'sentences' | 'words' | 'characters';
    onFocus?: () => void;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
};

const TextInput: React.FC<TextInputProps> = ({
    value,
    onChange,
    id,
    label,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    error,
    errorId,
    placeholder,
    type = 'text',
    disabled = false,
    debounce,
    maxLength,
    autoFocus,
    startIcon,
    endIcon,
    startButton,
    endButton,
    className = '',
    inputClassName = '',
    autocapitalize,
    onFocus,
    onBlur,
    onKeyDown,
}) => {
    const generatedId = React.useId();
    const inputId = id ?? `text-input-${generatedId}`;
    const resolvedErrorId = errorId ?? `${inputId}-error`;
    const describedBy = [ariaDescribedBy, error ? resolvedErrorId : undefined]
        .filter(Boolean)
        .join(' ');
    const hasStartContent = Boolean(startIcon || startButton);
    const hasEndContent = Boolean(endIcon || endButton);

    // Check if inputClassName overrides padding to avoid competing !important classes
    const hasPaddingLeftOverride = /\bpl-\[/.test(inputClassName);
    const hasPaddingRightOverride = /\bpr-\[/.test(inputClassName);

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
                {hasStartContent && (
                    <div className="absolute left-[15px] top-1/2 z-10 flex -translate-y-1/2 transform items-center">
                        {startIcon}
                        {startButton}
                    </div>
                )}

                <IonInput
                    id={inputId}
                    aria-label={ariaLabel ?? label ?? placeholder}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={describedBy || undefined}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    debounce={debounce}
                    maxlength={maxLength}
                    autoFocus={autoFocus}
                    autocapitalize={autocapitalize}
                    onIonInput={e => onChange(e.detail.value ?? '')}
                    onIonFocus={onFocus}
                    onIonBlur={onBlur}
                    onKeyDown={onKeyDown}
                    className={`text-grayscale-900 font-poppins text-[14px] leading-[130%] w-full
                        ${hasPaddingLeftOverride ? '' : hasStartContent ? '!pl-[48px]' : '!pl-[15px]'}
                        ${
                            hasPaddingRightOverride
                                ? ''
                                : hasEndContent
                                  ? '!pr-[48px] !py-[1px]'
                                  : '!pr-[15px] !py-0'
                        }
                        ${inputClassName}`}
                />

                {hasEndContent && (
                    <div className="absolute right-[5px] top-1/2 z-10 flex -translate-y-1/2 transform items-center">
                        {endIcon}
                        {endButton}
                    </div>
                )}
            </div>
            {error && (
                <p id={resolvedErrorId} className="mt-1.5 text-xs text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
};

export default TextInput;
