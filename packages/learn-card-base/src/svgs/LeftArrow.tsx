import React from 'react';

const LeftArrow: React.FC<{ className?: string; opacity?: string }> = ({
    className,
    opacity = '0.6',
}) => {
    return (
        <svg viewBox="0 0 30 31" fill="none" className={className}>
            <path
                d="M18.75 24.394L9.375 15.019L18.75 5.64401"
                stroke="currentColor"
                strokeOpacity={opacity}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default LeftArrow;
