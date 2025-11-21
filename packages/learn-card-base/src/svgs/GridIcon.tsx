import React from 'react';

type GridIconProps = {
    className?: string;
};

const GridIcon: React.FC<GridIconProps> = ({ className = '' }) => {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M17.4993 12.166H11.666V17.9993H17.4993V12.166Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.33333 12.166H2.5V17.9993H8.33333V12.166Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.4993 3H11.666V8.83333H17.4993V3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.33333 3H2.5V8.83333H8.33333V3Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default GridIcon;
