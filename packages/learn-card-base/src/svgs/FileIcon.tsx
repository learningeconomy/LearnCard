import React from 'react';

const FileIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg viewBox="0 0 40 41" fill="none" className={className}>
            <path
                d="M5 5.44666C5 3.7898 6.34315 2.44666 8 2.44666H18.1813C20.8361 2.44666 23.3555 3.61875 25.0655 5.64943L32.8842 14.9341C34.2507 16.5568 35 18.61 35 20.7314V36.1133C35 37.7702 33.6569 39.1133 32 39.1133H8C6.34315 39.1133 5 37.7702 5 36.1133V5.44666Z"
                fill="currentColor"
            />
            <path
                d="M21.5 13.78V3.28003C25.5 4.28003 34 14.78 35 18.78H26.5C22.5 18.78 21.5 16.78 21.5 13.78Z"
                fill="#FF7A7A"
            />
        </svg>
    );
};

export default FileIcon;
