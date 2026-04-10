import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    bg?: string;
    text?: string;
    border?: string;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    bg = 'bg-gray-800',
    text = 'text-gray-300',
    border,
    className = '',
}) => (
    <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${bg} ${text} ${
            border ? `border ${border}` : ''
        } ${className}`}
    >
        {children}
    </span>
);
