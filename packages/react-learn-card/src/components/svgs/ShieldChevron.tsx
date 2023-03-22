import React from 'react';

const ShieldChevron: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg viewBox="0 0 46 46" fill="none" className={className} data-testid="socialBadge-icon">
            <path
                d="M7.53125 19.25V8.9375C7.53125 8.56454 7.67941 8.20685 7.94313 7.94313C8.20685 7.67941 8.56454 7.53125 8.9375 7.53125H37.0625C37.4355 7.53125 37.7931 7.67941 38.0569 7.94313C38.3206 8.20685 38.4688 8.56454 38.4688 8.9375V19.25C38.4688 34.0183 25.9345 38.9112 23.4318 39.7409C23.152 39.8372 22.848 39.8372 22.5682 39.7409C20.0655 38.9112 7.53125 34.0183 7.53125 19.25Z"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M36.0785 29.3425L23 20.1875L9.92139 29.3425"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ShieldChevron;
