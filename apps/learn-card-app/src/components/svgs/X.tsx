import React from 'react';

const X: React.FC<{ className?: string; strokeWidth?: string }> = ({
    className,
    strokeWidth = '3',
}) => {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="X"
        >
            <path
                d="M25 7L7 25"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M25 25L7 7"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default X;
