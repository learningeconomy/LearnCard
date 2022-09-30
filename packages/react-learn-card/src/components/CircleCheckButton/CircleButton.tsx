import React from 'react';
import { CircleButtonProps } from '../../types';

export const CircleCheckButton: React.FC<CircleButtonProps> = ({
    checked,
    onClick,
    className = '',
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-4 border rounded text-gray-700 ${className}`}
        ></button>
    );
};

export default CircleCheckButton;
