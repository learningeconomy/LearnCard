import React from 'react';

export const DocIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
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
                fill="currentColor"
            />
            <path
                d="M28 14.871V2C32.7407 3.22581 42.8148 16.0968 44 21H33.9259C29.1852 21 28 18.5484 28 14.871Z"
                fill="currentColor"
            />
            <rect x="15" y="25.8555" width="21.25" height="2.83907" fill="white" />
            <rect x="15" y="31.7051" width="21.25" height="2.83907" fill="white" />
            <rect x="15" y="37.5566" width="14.4886" height="2.83907" fill="white" />
        </svg>
    );
};

export default DocIcon;
