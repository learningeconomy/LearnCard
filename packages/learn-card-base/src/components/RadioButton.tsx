import React from 'react';

type RadioButtonProps = {
    checked: boolean;
    onClick: (value: boolean) => void;
    'aria-label': string;
    className?: string;
};

export const RadioButton: React.FC<RadioButtonProps> = ({
    checked,
    onClick,
    'aria-label': ariaLabel,
    className = '',
}) => {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={ariaLabel}
            onClick={() => onClick(!checked)}
            className={`transition-colors h-8 w-8 rounded-full flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                checked ? 'bg-emerald-700' : 'bg-grayscale-200'
            } ${className}`}
        >
            <div
                role="presentation"
                className={`transition-transform ${
                    checked ? 'scale-100' : 'scale-0'
                } h-4 w-4 bg-gray-50 rounded-full`}
            />
        </button>
    );
};

export default RadioButton;
