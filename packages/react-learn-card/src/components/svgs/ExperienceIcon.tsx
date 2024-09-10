import React from 'react';

const ExperienceIcon: React.FC<{ className?: string; size?: string }> = ({
    className = '',
    size = '',
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 25 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M10.3756 5.4458L2.93802 18.5541H11.7685L14.7908 13.2305L10.3756 5.4458Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.8132 18.5541H22.062L16.9109 9.48535L14.7908 13.2306L11.7685 18.5541H17.8132Z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ExperienceIcon;
