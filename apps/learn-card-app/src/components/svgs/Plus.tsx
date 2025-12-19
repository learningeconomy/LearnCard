import React from 'react';

const Plus: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg viewBox="0 0 31 30" fill="none" className={className}>
            <path
                d="M5.1875 15H25.8125"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.5 4.6875V25.3125"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Plus;
