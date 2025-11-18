import React from 'react';

const CoursesIconThin: React.FC<{ className?: string; shadeshadeColor?: string }> = ({
    className = '',
    shadeColor = '#E2E3E9',
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="31"
            height="25"
            viewBox="0 0 31 25"
            fill="none"
            className={className}
        >
            <path
                d="M24.4864 12.0166V20.1596C24.4864 22.3726 22.4667 24.1667 19.9851 24.1667H10.8215C8.32921 24.1667 6.32031 22.3726 6.32031 20.1596V12.0166"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.398 16.1847L0.916748 8.5036L15.398 0.833252L29.89 8.5036L15.398 16.1847Z"
                fill={shadeColor}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M29.8901 8.50366V16.1848"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default CoursesIconThin;
