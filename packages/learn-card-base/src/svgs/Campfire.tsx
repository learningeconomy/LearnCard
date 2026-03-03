import React from 'react';

const Campfire: React.FC<{ className?: string; firewoodColor?: string; }> = ({ className = '', firewoodColor = 'currentColor' }) => {
    return (
        <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M22.5 13.125C22.5 17.6123 18.8623 21.25 14.375 21.25C9.88769 21.25 6.25 17.6123 6.25 13.125C6.25 8.63769 9.375 6.875 10.625 2.5C15.625 4.68743 15.625 11.25 15.625 11.25C15.625 11.25 16.875 7.5 20.625 6.5625C20.9375 10 22.5 11.2089 22.5 13.125Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4.375 22.5L24.375 27.5"
                stroke={firewoodColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4.375 27.5L24.375 22.5"
                stroke={firewoodColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Campfire;
