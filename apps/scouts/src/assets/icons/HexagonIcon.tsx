import React from 'react';

interface HexagonIconProps {
    width?: number;
    height?: number;
    fill?: string;
    className?: string;
}

const HexagonIcon: React.FC<HexagonIconProps> = ({
    width = 74,
    height = 84,
    fill = '#82E6DE',
    className = '',
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 74 84"
            fill="none"
            className={className}
        >
            <path
                d="M74 62.9V20.9667L37.002 0L0 20.9667V62.9L37.002 83.8667L74 62.9Z"
                fill={fill}
            />
        </svg>
    );
};

export default HexagonIcon;
