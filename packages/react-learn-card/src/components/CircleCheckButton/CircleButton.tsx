import React from 'react';
import { CircleButtonProps } from '../../types';
import { CheckmarkSvg } from '../RoundedPill';

export const CircleCheckButton: React.FC<CircleButtonProps> = ({
    checked,
    onClick,
    className = '',
}) => {
    const bgColor = checked ? 'bg-emerald-700' : 'bg-gray-50';

    const handleClick = () => {
        onClick?.();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`w-[32px] h-[32px] flex items-center justify-center border-4 border-gray-50 rounded-full text-gray-700  ${bgColor} ${className}`}
        >
            <CheckmarkSvg color="#ffffff" />
        </button>
    );
};

export default CircleCheckButton;
