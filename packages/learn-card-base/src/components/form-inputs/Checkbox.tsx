import React from 'react';

type CheckboxProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
    className?: string;
};

const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onChange,
    label,
    disabled = false,
    className = '',
}) => {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`inline-flex items-center gap-[5px] px-[10px] py-[5px] rounded-[10px] transition-colors duration-200 ease-in-out border-[1px] border-solid
                ${
                    checked
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-grayscale-50 border-grayscale-50'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
        >
            <span
                className={`font-poppins text-[12px] leading-[130%] font-bold transition-colors duration-200
                    ${checked ? 'text-grayscale-900' : 'text-grayscale-700'}
                `}
            >
                {label}
            </span>
            <span
                className={`w-[16px] h-[16px] rounded-full flex items-center justify-center transition-colors duration-200
                    ${checked ? 'bg-emerald-500' : 'bg-grayscale-300'}
                `}
            >
                {checked && (
                    <div className="bg-white rounded-full h-[7.5px] w-[7.5px] shadow-bottom-2-4" />
                )}
            </span>
        </button>
    );
};

export default Checkbox;
