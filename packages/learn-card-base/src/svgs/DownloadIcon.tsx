import React from 'react';

type DownloadIconProps = {
    className?: string;
};

const DownloadIcon: React.FC<DownloadIconProps> = ({ className = '' }) => {
    return (
        <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <line
                x1="6.5"
                y1="24.5"
                x2="23.5"
                y2="24.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
            />
            <path
                d="M10.5 13.75L15.5 18.75L20.5 13.75"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15.5 18.75L15.5 2.5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default DownloadIcon;
