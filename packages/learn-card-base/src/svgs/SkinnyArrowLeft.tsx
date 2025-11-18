import React from 'react';

export const SkinnyArrowLeft: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={className}>
            <g clipPath="url(#clip0_5088_49266)">
                <path
                    d="M16.875 10H3.125"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M8.75 4.375L3.125 10L8.75 15.625"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
            <defs>
                <clipPath id="clip0_5088_49266">
                    <rect width="20" height="20" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default SkinnyArrowLeft;
