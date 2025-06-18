import React, { type MouseEventHandler } from 'react';

export type ButtonProps = {
    text?: string;
    onClick: MouseEventHandler<HTMLButtonElement>;
    className?: string;
};

export const Button: React.FC<ButtonProps> = ({ text, onClick, className = '' }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`p-4 border rounded text-gray-700 ${className}`}
        >
            {text}
        </button>
    );
};

export default Button;
