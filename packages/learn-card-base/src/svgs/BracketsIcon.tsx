import React from 'react';

export const BracketsIcon: React.FC<{ className: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="31"
            viewBox="0 0 30 31"
            fill="none"
            className={className}
        >
            <path
                d="M20 22.9326L27.5 15.4326L20 7.93262"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10 7.93262L2.5 15.4326L10 22.9326"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default BracketsIcon;
