import React from 'react';

export const SkinnyArrowRight: React.FC<{ className?: string; version?: '1' | '2' }> = ({
    className = '',
    version = '1',
}) => {
    if (version === '1') {
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
                    d="M3.90625 13L21.0938 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M14.0625 5.96875L21.0938 13L14.0625 20.0312"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
};

export default SkinnyArrowRight;
