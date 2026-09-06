import React from 'react';

type RadioButtonProps = {
    checked: boolean;
    onClick: (value: boolean) => void;
    'aria-label': string;
    tabIndex?: number;
    className?: string;
};

export const RadioButton: React.FC<RadioButtonProps> = ({
    checked,
    onClick,
    'aria-label': ariaLabel,
    tabIndex,
    className = '',
}) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>): void => {
        const keyDirection: Record<string, number> = {
            ArrowDown: 1,
            ArrowRight: 1,
            ArrowUp: -1,
            ArrowLeft: -1,
        };
        const direction = keyDirection[event.key];
        const group = event.currentTarget.closest('[role="radiogroup"]');
        const radios = group
            ? Array.from(
                  group.querySelectorAll<HTMLButtonElement>('button[role="radio"]:not([disabled])')
              )
            : [];
        const currentIndex = radios.indexOf(event.currentTarget);
        let nextIndex: number | undefined;

        if (direction !== undefined && currentIndex >= 0) {
            nextIndex = (currentIndex + direction + radios.length) % radios.length;
        } else if (event.key === 'Home') {
            nextIndex = 0;
        } else if (event.key === 'End') {
            nextIndex = radios.length - 1;
        }

        if (nextIndex === undefined || !radios[nextIndex]) return;

        event.preventDefault();
        radios[nextIndex].click();
        radios[nextIndex].focus();
    };

    return (
        <button
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={ariaLabel}
            tabIndex={tabIndex}
            onKeyDown={handleKeyDown}
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
