import React from 'react';

type XProps = {
    className?: string;
    size?: string;
};

const X: React.FC<XProps> = ({ className = '', size = '26' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M6.75 6.75L20.0565 20.0565"
                stroke="#14142B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M6.75 20.0566L20.0565 6.75019"
                stroke="#14142B"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default X;
