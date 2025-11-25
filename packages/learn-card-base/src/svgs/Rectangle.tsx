import React from 'react';

const Rectangle: React.FC<{ className?: string; color: string; }> = ({ className, color }) => {
    return (
        <svg width="200" height="140" viewBox="0 0 200 140" fill="none" className={className}>
            <path
                d="M0 12.7273C0 5.69819 5.69819 0 12.7273 0H187.273C194.302 0 200 5.69819 200 12.7273V40C200 95.2285 155.228 140 100 140V140C44.7715 140 0 95.2285 0 40V12.7273Z"
                fill={color}
            />
        </svg>
    );
};

export default Rectangle;
