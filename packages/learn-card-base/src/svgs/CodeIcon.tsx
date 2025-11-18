import React from 'react';

type CodeIconProps = {
    className?: string;
    size?: string;
};

const CodeIcon: React.FC<CodeIconProps> = ({ className = '', size = '30' }) => {
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
};

export default CodeIcon;
