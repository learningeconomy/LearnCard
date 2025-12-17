import React from 'react';

export const CsvIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="50"
            height="50"
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M6 5C6 3.34315 7.34315 2 9 2H28L44 21V45C44 46.6569 42.6569 48 41 48H9C7.34315 48 6 46.6569 6 45V5Z"
                fill="#EAB308"
            />
            <path
                d="M28 14.871V2C32.7407 3.22581 42.8148 16.0968 44 21H33.9259C29.1852 21 28 18.5484 28 14.871Z"
                fill="#FEF08A"
            />
            <rect
                x="17.5"
                y="22.5"
                width="8"
                height="3"
                transform="rotate(-90 17.5 22.5)"
                fill="white"
            />
            <rect
                x="17.5"
                y="11"
                width="8"
                height="3"
                transform="rotate(-90 17.5 11)"
                fill="white"
            />
            <rect
                x="17.5"
                y="34"
                width="8"
                height="3"
                transform="rotate(-90 17.5 34)"
                fill="white"
            />
            <path
                d="M19.0833 39.1667C20.2339 39.1667 21.1667 38.2339 21.1667 37.0833C21.1667 35.9327 20.2339 35 19.0833 35C17.9327 35 17 35.9327 17 37.0833C17 38.2339 17.9327 39.1667 19.0833 39.1667Z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default CsvIcon;
