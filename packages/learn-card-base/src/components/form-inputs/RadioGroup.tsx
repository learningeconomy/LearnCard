import React from 'react';

type RadioOption = {
    value: string;
    label: string;
};

type RadioGroupProps = {
    value: string | null;
    onChange: (value: string) => void;
    options: RadioOption[];
    name: string;
    columns?: 1 | 2 | 3;
    disabled?: boolean;
    className?: string;
};

const RadioGroup: React.FC<RadioGroupProps> = ({
    value,
    onChange,
    options,
    name,
    columns = 2,
    disabled = false,
    className = '',
}) => {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-[10px] ${className}`}>
            {options.map(option => {
                const isSelected = value === option.value;
                return (
                    <label
                        key={option.value}
                        className={`flex items-center gap-[10px] cursor-pointer ${
                            disabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={option.value}
                            checked={isSelected}
                            onChange={() => !disabled && onChange(option.value)}
                            disabled={disabled}
                            className="sr-only"
                        />
                        <span
                            className={`w-[25px] h-[25px] rounded-full flex items-center justify-center flex-shrink-0
                                ${isSelected ? 'bg-emerald-500' : 'bg-grayscale-300'}
                            `}
                        >
                            {isSelected && (
                                <div className="w-[12.5px] h-[12.5px] bg-white rounded-full shadow-bottom-2-4" />
                            )}
                        </span>
                        <span
                            className={`font-poppins text-[14px] leading-[130%] ${
                                isSelected ? 'text-grayscale-900 font-bold' : 'text-grayscale-600'
                            }`}
                        >
                            {option.label}
                        </span>
                    </label>
                );
            })}
        </div>
    );
};

export default RadioGroup;
