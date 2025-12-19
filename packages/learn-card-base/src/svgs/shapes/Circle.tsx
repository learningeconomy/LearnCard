import React from 'react';

export const Circle: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="81"
            height="80"
            viewBox="0 0 81 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Circle"
        >
            <circle cx="40.75" cy="40" r="40" fill="currentColor" />
        </svg>
    );
};

export default Circle;
