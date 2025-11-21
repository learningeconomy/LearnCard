import React from 'react';

export const DotIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="10" height="10" rx="5" fill="currentColor" />
        </svg>
    );
};

export default DotIcon;
