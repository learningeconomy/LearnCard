import React from 'react';
import { IonInput } from '@ionic/react';

type TextInputProps = {
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
    disabled?: boolean;
    debounce?: number;
    maxLength?: number;
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
    placeholder,
    type = 'text',
    disabled = false,
    debounce,
    maxLength,
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
    const hasStartContent = Boolean(startIcon || startButton);
    const hasEndContent = Boolean(endIcon || endButton);

    // Check if inputClassName overrides padding to avoid competing !important classes
    const hasPaddingLeftOverride = /\bpl-\[/.test(inputClassName);
    const hasPaddingRightOverride = /\bpr-\[/.test(inputClassName);

    return (
        <div className={`relative flex items-center bg-grayscale-100 rounded-[10px] ${className}`}>
            {hasStartContent && (
                <div className="absolute left-[15px] top-1/2 transform -translate-y-1/2 z-10 flex items-center">
                    {startIcon}
                    {startButton}
                </div>
            )}

            <IonInput
                type={type}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                debounce={debounce}
                maxlength={maxLength}
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
                <div className="absolute right-[5px] top-1/2 transform -translate-y-1/2 z-10 flex items-center">
                    {endIcon}
                    {endButton}
                </div>
            )}
        </div>
    );
};

export default TextInput;
