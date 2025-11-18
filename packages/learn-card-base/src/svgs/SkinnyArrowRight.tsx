import React from 'react';

export const SkinnyArrowLeft: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
            <path
                d="M3.125 10H16.875"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11.25 4.375L16.875 10L11.25 15.625"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default SkinnyArrowLeft;
