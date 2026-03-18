import React from 'react';

type ToggleProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    labelPosition?: 'left' | 'right';
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md';
};

const Toggle: React.FC<ToggleProps> = ({
    checked,
    onChange,
    label,
    labelPosition = 'left',
    disabled = false,
    className = '',
    size = 'md',
}) => {
    const sizeClasses = {
        sm: {
            track: 'w-[36px] h-[20px]',
            thumb: 'w-[16px] h-[16px]',
            translate: 'translate-x-[18px]',
        },
        md: {
            track: 'w-[44px] h-[24px]',
            thumb: 'w-[20px] h-[20px]',
            translate: 'translate-x-[22px]',
        },
    };

    const sizes = sizeClasses[size];

    const toggle = (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
                ${sizes.track}
                ${checked ? 'bg-emerald-500' : 'bg-grayscale-300'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <span
                className={`inline-block rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out
                    ${sizes.thumb}
                    ${checked ? sizes.translate : 'translate-x-[2px]'}
                `}
            />
        </button>
    );

    if (!label) {
        return <div className={className}>{toggle}</div>;
    }

    return (
        <div className={`flex items-center gap-[8px] ${className}`}>
            {labelPosition === 'left' && (
                <span className="text-grayscale-900 font-poppins text-[14px] leading-[130%]">
                    {label}
                </span>
            )}
            {toggle}
            {labelPosition === 'right' && (
                <span className="text-grayscale-900 font-poppins text-[14px] leading-[130%]">
                    {label}
                </span>
            )}
        </div>
    );
};

export default Toggle;
