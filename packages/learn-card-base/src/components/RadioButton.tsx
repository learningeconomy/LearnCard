import React from 'react';

type RadioButtonProps = {
    checked: boolean;
    onClick: (value: boolean) => void;
    className?: string;
};

export const RadioButton: React.FC<RadioButtonProps> = ({ checked, onClick, className = '' }) => {
    return (
        <button
            type="button"
            onClick={() => onClick(!checked)}
            className={`transition-colors h-8 w-8 rounded-full flex items-center justify-center ${checked ? 'bg-emerald-700' : 'bg-grayscale-200'
                } ${className}`}
        >
            <div
                role="presentation"
                className={`transition-transform ${checked ? 'scale-100' : 'scale-0'
                    } h-4 w-4 bg-gray-50 rounded-full`}
            />
        </button>
    );
};

export default RadioButton;
