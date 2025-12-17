import React from 'react';

interface CircleIconProps {
    width?: number;
    height?: number;
    fill?: string;
    opacity?: number;
    className?: string;
}

const CircleIcon: React.FC<CircleIconProps> = ({
    width = 74,
    height = 74,
    fill = '#9FED8F',
    opacity = 0.5,
    className = '',
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 74 74"
            fill="none"
            className={className}
        >
            <circle opacity={opacity} cx="37" cy="37" r="37" fill={fill} />
        </svg>
    );
};

export default CircleIcon;
