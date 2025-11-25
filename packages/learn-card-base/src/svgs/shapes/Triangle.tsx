import React from 'react';

export const Triangle: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="87"
            height="80"
            viewBox="0 0 87 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Triangle"
        >
            <path d="M43.25 80L0.25 0L86.25 8.07577e-06L43.25 80Z" fill="currentColor" />
        </svg>
    );
};

export default Triangle;
