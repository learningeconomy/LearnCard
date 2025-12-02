import React from 'react';

export const ScoutLeaderHalfCircle: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="13"
            viewBox="0 0 26 13"
            fill="none"
            className={className}
        >
            <path
                d="M25.5 0C25.5 6.90401 19.9035 12.5005 12.9995 12.5005C6.09547 12.5005 0.5 6.90401 0.5 0H25.5Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default ScoutLeaderHalfCircle;
