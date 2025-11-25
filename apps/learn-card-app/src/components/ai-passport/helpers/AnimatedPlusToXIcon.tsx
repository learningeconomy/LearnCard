import React from 'react';

const AnimatedPlusToXIcon: React.FC<{
    className?: string;
    strokeWidth?: string;
    isPlus: boolean;
}> = ({ className, strokeWidth = '3', isPlus }) => {
    return (
        <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label={isPlus ? 'Plus' : 'X'}
        >
            <path
                d="M7 16H25"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    transform: isPlus ? 'rotate(0deg)' : 'rotate(45deg)',
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease-in-out',
                }}
            />

            <path
                d="M16 7V25"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    transform: isPlus ? 'rotate(0deg)' : 'rotate(45deg)',
                    transformOrigin: 'center',
                    transition: 'transform 0.3s ease-in-out',
                }}
            />
        </svg>
    );
};

export default AnimatedPlusToXIcon;
