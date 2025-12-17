import React from 'react';

export const TroopGlobalLeader: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            className={className}
        >
            <rect width="40" height="40" fill="#9FED8F" />
            <path
                d="M30.9912 26.25V13.75L20.2462 7.5L9.5 13.75V26.25L20.2462 32.5L30.9912 26.25Z"
                fill="#622599"
            />
        </svg>
    );
};

export default TroopGlobalLeader;
