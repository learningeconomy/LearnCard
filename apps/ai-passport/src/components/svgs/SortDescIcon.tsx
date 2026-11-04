import React from 'react';

type SortDescIconProps = {
    className?: string;
};

const SortDescIcon: React.FC<SortDescIconProps> = ({ className = '' }) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M11 5.5H21"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11 9.5H18"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M11 13.5H15"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M3 17.5L6 20.5L9 17.5"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M6 18.5V4.5"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default SortDescIcon;
