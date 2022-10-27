import React from 'react';

export const GenericArrow: React.FC<{
    className?: string;
    color?: string;
    width?: string;
    height?: string;
}> = ({ className = '', color = '#18224E', width = '20', height = '19' }) => {
    return (
        <svg
            width={width}
            className={className}
            height={height}
            viewBox="0 0 12 19"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M2.375 1.6875L10.1875 9.5L2.375 17.3125"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default GenericArrow;
