import React from 'react';

export const ScoutDiamond: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 26 26"
            fill="none"
            className={className}
        >
            <path d="M25.5 13L13 0.5L0.50002 13L13 25.5L25.5 13Z" fill="currentColor" />
        </svg>
    );
};

export default ScoutDiamond;
