import React from 'react';

const CaretRight: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            viewBox="0 0 25 24"
            fill="none"
            className={className}
        >
            <path
                d="M9.5 4.5L17 12L9.5 19.5"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default CaretRight;
