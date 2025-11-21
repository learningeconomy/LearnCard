import React from 'react';

type ScoutIdThumbPlaceholderProps = {
    className?: string;
};

const ScoutIdThumbPlaceholder: React.FC<ScoutIdThumbPlaceholderProps> = ({ className = '' }) => {
    return (
        <svg
            width="80"
            height="80"
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="80" height="80" transform="translate(0 0.5)" fill="#9FED8F" />
            <path
                d="M65.0009 40.5L40.001 15.5L15.001 40.5L40.001 65.4999L65.0009 40.5Z"
                fill="#248737"
            />
        </svg>
    );
};

export default ScoutIdThumbPlaceholder;
