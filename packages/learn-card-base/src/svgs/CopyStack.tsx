import React from 'react';

const CopyStack: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg viewBox="0 0 30 30" fill="none" className={className}>
            <path
                d="M25.7806 20.6246V4.21826H9.37354"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M21.093 8.90576H4.68604V25.312H21.093V8.90576Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default CopyStack;
