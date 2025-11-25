import React from 'react';

export const SkinnyArrowLeft: React.FC<{ className?: string; version?: '1' | '2' }> = ({
    className = '',
    version = '1',
}) => {
    if (version === '1') {
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
    } else if (version === '2') {
        return (
            <svg
                width="25"
                height="25"
                viewBox="0 0 25 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path
                    d="M21.0938 13L3.90625 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M10.9375 5.96875L3.90625 13L10.9375 20.0312"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
};

export default SkinnyArrowLeft;
