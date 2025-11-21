import React from 'react';

interface DiamondIconProps {
    width?: number;
    height?: number;
    fill?: string;
    className?: string;
}

const DiamondIcon: React.FC<DiamondIconProps> = ({
    width = 74,
    height = 74,
    fill = '#FF8DFF',
    className = '',
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 75 74"
            fill="none"
            className={className}
        >
            <path
                d="M74.2705 36.7676L37.501 -0.00195312L0.731425 36.7676L37.501 73.5372L74.2705 36.7676Z"
                fill={fill}
            />
        </svg>
    );
};

export default DiamondIcon;
