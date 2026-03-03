import React from 'react';

const ReadDocsQuickNav: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="50"
            height="50"
            viewBox="0 0 50 50"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M4.16602 6.25H16.666C18.8762 6.25 20.9958 7.12797 22.5586 8.69078C24.1214 10.2536 24.9993 12.3732 24.9994 14.5833V43.75C24.9994 42.0924 24.3409 40.5027 23.1688 39.3306C21.9967 38.1585 20.407 37.5 18.7493 37.5H4.16602V6.25Z"
                fill="white"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M45.8333 6.25H33.3333C31.1232 6.25 29.0036 7.12797 27.4408 8.69078C25.878 10.2536 25 12.3732 25 14.5833V43.75C25 42.0924 25.6585 40.5027 26.8306 39.3306C28.0027 38.1585 29.5924 37.5 31.25 37.5H45.8333V6.25Z"
                fill="white"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export default ReadDocsQuickNav;
