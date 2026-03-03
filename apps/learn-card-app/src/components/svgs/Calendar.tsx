import React from 'react';

const Calendar: React.FC<{ className?: string; version?: 'outline' | 'filled-top' }> = ({
    className = '',
    version = 'outline',
}) => {
    if (version === 'filled-top') {
        return (
            <svg
                width="25"
                height="26"
                viewBox="0 0 25 26"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path
                    d="M20.3125 4.33984H4.6875C4.25603 4.33984 3.90625 4.68962 3.90625 5.12109V20.7461C3.90625 21.1776 4.25603 21.5273 4.6875 21.5273H20.3125C20.744 21.5273 21.0938 21.1776 21.0938 20.7461V5.12109C21.0938 4.68962 20.744 4.33984 20.3125 4.33984Z"
                    fill="white"
                    stroke="#353E64"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    opacity="0.2"
                    d="M4.6875 4.40234H20.3125C20.5031 4.40234 20.6855 4.47849 20.8203 4.61328C20.9551 4.74807 21.0312 4.93047 21.0312 5.12109V8.96484H3.96875V5.12109C3.96875 4.93047 4.0449 4.74807 4.17969 4.61328C4.31448 4.47849 4.49688 4.40234 4.6875 4.40234Z"
                    fill="#18224E"
                    stroke="#353E64"
                    strokeWidth="0.125"
                />
                <path
                    d="M17.1875 2.77734V5.90234"
                    stroke="#18224E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M7.8125 2.77734V5.90234"
                    stroke="#18224E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M3.90625 9.02734H21.0938"
                    stroke="#18224E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className={className}
        >
            <path
                d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M3 10H21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 2V6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8 2V6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Calendar;
