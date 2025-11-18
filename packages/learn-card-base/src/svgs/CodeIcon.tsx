import React from 'react';

type CodeIconProps = {
    className?: string;
    size?: string;
    version?: 'no-slash' | 'with-slash';
};

const CodeIcon: React.FC<CodeIconProps> = ({
    className = '',
    size = '30',
    version = 'no-slash',
}) => {
    if (version === 'no-slash') {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 30 31"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path
                    d="M20 22.9326L27.5 15.4326L20 7.93262"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M10 7.93262L2.5 15.4326L10 22.9326"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    } else if (version === 'with-slash') {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 25 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path
                    d="M6.25 9.09375L1.5625 13L6.25 16.9062"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M18.75 9.09375L23.4375 13L18.75 16.9062"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M15.625 4.40625L9.375 21.5938"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    } else {
        return null; // make TS happy
    }
};

export default CodeIcon;
