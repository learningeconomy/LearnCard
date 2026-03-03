import React from 'react';

export const FolderIcon: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            width="35"
            height="35"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M32.0827 27.7083C32.0827 28.4819 31.7754 29.2237 31.2284 29.7707C30.6814 30.3177 29.9396 30.625 29.166 30.625H5.83268C5.05913 30.625 4.31727 30.3177 3.77029 29.7707C3.22331 29.2237 2.91602 28.4819 2.91602 27.7083V7.29167C2.91602 6.51812 3.22331 5.77625 3.77029 5.22927C4.31727 4.68229 5.05913 4.375 5.83268 4.375H13.1243L16.041 8.75H29.166C29.9396 8.75 30.6814 9.05729 31.2284 9.60427C31.7754 10.1513 32.0827 10.8931 32.0827 11.6667V27.7083Z"
                stroke="#353E64"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M13.125 20.416H21.875"
                stroke="#353E64"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default FolderIcon;
