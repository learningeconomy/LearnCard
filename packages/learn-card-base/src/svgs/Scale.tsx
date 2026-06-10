import React from 'react';

const Scale: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="35"
            height="35"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M23.3333 23.3327L27.7083 11.666L32.0833 23.3327C30.8146 24.2806 29.2833 24.791 27.7083 24.791C26.1333 24.791 24.6021 24.2806 23.3333 23.3327Z"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M2.91667 23.3327L7.29167 11.666L11.6667 23.3327C10.3979 24.2806 8.86667 24.791 7.29167 24.791C5.71667 24.791 4.18542 24.2806 2.91667 23.3327Z"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10.2083 30.625H24.7917"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.5 4.375V30.625"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4.375 10.2077H7.29167C10.2083 10.2077 14.5833 8.74935 17.5 7.29102C20.4167 8.74935 24.7917 10.2077 27.7083 10.2077H30.625"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Scale;
