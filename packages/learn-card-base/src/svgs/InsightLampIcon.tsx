import React from 'react';

const InsightLampIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            className={className}
        >
            <path
                d="M17.5 6.25L13.75 10L16.25 18.75L26.25 8.75L17.5 6.25Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.5 6.25L13.75 10L10 6.25L13.75 2.5L17.5 6.25Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11.875 8.125L5 15L8.75 22.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M3.75 27.5V25C3.75 23.625 4.875 22.5 6.25 22.5H11.25C11.913 22.5 12.5489 22.7634 13.0178 23.2322C13.4866 23.7011 13.75 24.337 13.75 25V27.5H3.75Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default InsightLampIcon;
