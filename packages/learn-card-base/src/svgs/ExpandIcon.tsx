import React from 'react';

export const ExpandIcon: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path d="M17.5 17.5L12.5 12.5ZM17.5 17.5V13.5ZM17.5 17.5H13.5Z" fill="currentColor" />
            <path
                d="M17.5 17.5L12.5 12.5M17.5 17.5V13.5M17.5 17.5H13.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M2.5 13.5V17.5ZM2.5 17.5H6.5ZM2.5 17.5L7.5 12.5Z" fill="currentColor" />
            <path
                d="M2.5 13.5V17.5M2.5 17.5H6.5M2.5 17.5L7.5 12.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.5 6.5V2.5M17.5 2.5H13.5M17.5 2.5L12.5 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2.5 6.5V2.5M2.5 2.5H6.5M2.5 2.5L7.5 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ExpandIcon;
