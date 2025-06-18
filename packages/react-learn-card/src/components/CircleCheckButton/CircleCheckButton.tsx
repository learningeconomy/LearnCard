import React from 'react';
import type { CircleCheckButtonProps } from '../../types';
import { CheckmarkSvg } from '../RoundedPill';

export const CircleCheckButton: React.FC<CircleCheckButtonProps> = ({
    checked,
    onClick,
    bgColor,
    className = '',
}) => {
    const backgroundColor = checked ? 'bg-emerald-700' : (bgColor ?? 'bg-gray-50');

    const handleClick = () => {
        onClick?.();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`w-[32px] h-[32px] flex items-center justify-center border-4 border-gray-50 rounded-full text-gray-700  ${backgroundColor} ${className}`}
        >
            <CheckmarkSvg color="#ffffff" />
        </button>
    );
};

export default CircleCheckButton;
