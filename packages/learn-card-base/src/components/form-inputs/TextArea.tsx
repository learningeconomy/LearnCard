import React from 'react';
import { IonTextarea } from '@ionic/react';

type TextAreaProps = {
    value: string | null | undefined;
    onChange: (value: string | null | undefined) => void;
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
    return (
        <div className={`relative flex items-center bg-grayscale-100 rounded-[10px] ${className}`}>
            <IonTextarea
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
    );
};

export default TextArea;
