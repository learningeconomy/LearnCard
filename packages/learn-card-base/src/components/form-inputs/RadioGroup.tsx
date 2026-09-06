import React from 'react';

type RadioOption = {
    value: string;
    label: string;
};

type RadioGroupAccessibleName =
    | {
          'aria-label': string;
          'aria-labelledby'?: never;
      }
    | {
          'aria-label'?: never;
          'aria-labelledby': string;
      };

type RadioGroupProps = {
    value: string | null;
    onChange: (value: string | null) => void;
    options: RadioOption[];
    columns?: 1 | 2 | 3;
    disabled?: boolean;
    className?: string;
    allowDeselect?: boolean;
} & RadioGroupAccessibleName;

const RadioGroup: React.FC<RadioGroupProps> = ({
    value,
    onChange,
    options,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    columns = 2,
    disabled = false,
    className = '',
    allowDeselect = false,
}) => {
    const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
    };

    const selectOption = (option: RadioOption, isSelected: boolean): void => {
        if (disabled) return;

        onChange(allowDeselect && isSelected ? null : option.value);
    };

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        currentIndex: number
    ): void => {
        if (disabled) return;

        const keyDirection: Record<string, number> = {
            ArrowDown: 1,
            ArrowRight: 1,
            ArrowUp: -1,
            ArrowLeft: -1,
        };
        const direction = keyDirection[event.key];
        let nextIndex: number | undefined;

        if (direction !== undefined) {
            nextIndex = (currentIndex + direction + options.length) % options.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = options.length - 1;
        }

        if (nextIndex === undefined) return;

        event.preventDefault();
        onChange(options[nextIndex].value);
        optionRefs.current[nextIndex]?.focus();
    };

    return (
        <div
            role="radiogroup"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            className={`grid ${gridCols[columns]} gap-[10px] ${className}`}
        >
            {options.map((option, index) => {
                const isSelected = value === option.value;
                const isTabStop = isSelected || (value === null && index === 0);

                return (
                    <button
                        ref={element => {
                            optionRefs.current[index] = element;
                        }}
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isTabStop ? 0 : -1}
                        disabled={disabled}
                        onClick={() => selectOption(option, isSelected)}
                        onKeyDown={event => handleKeyDown(event, index)}
                        className={`flex items-center gap-[10px] cursor-pointer rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                            disabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        <span
                            aria-hidden="true"
                            className={`w-[25px] h-[25px] rounded-full flex items-center justify-center flex-shrink-0
                                ${isSelected ? 'bg-emerald-500' : 'bg-grayscale-300'}
                            `}
                        >
                            {isSelected && (
                                <span className="w-[12.5px] h-[12.5px] bg-white rounded-full shadow-bottom-2-4" />
                            )}
                        </span>
                        <span
                            className={`font-poppins text-[14px] leading-[130%] ${
                                isSelected ? 'text-grayscale-900 font-bold' : 'text-grayscale-600'
                            }`}
                        >
                            {option.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default RadioGroup;
