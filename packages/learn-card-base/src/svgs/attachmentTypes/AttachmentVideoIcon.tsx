import React from 'react';

export const AttachmentVideoIcon: React.FC<{ className?: string; version?: string }> = ({
    className = '',
}) => {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.18 13.0167C13.18 14.6775 12.0483 15.8508 10.2383 15.8508H5.0575C3.24917 15.8508 2.125 14.6775 2.125 13.0167V7.21667C2.125 5.55667 3.24917 4.375 5.06667 4.375H10.2383C12.0483 4.375 13.18 5.55667 13.18 7.21667V13.0167Z"
                fill="#6D28D9"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M13.1816 9.39733L16.5958 6.60233C17.1375 6.1565 17.96 6.544 17.96 7.24983V12.9765C17.96 13.6832 17.1375 14.069 16.5958 13.624L13.1816 10.829"
                fill="#8B5CF6"
            />
        </svg>
    );
};

export default AttachmentVideoIcon;
