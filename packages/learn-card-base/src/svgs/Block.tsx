import React from 'react';

const Block: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg width="31" height="30" viewBox="0 0 31 30" fill="none" className={className}>
            <path
                d="M15.5 27.5C22.4036 27.5 28 21.9036 28 15C28 8.09644 22.4036 2.5 15.5 2.5C8.59644 2.5 3 8.09644 3 15C3 21.9036 8.59644 27.5 15.5 27.5Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M6.6626 6.16248L24.3376 23.8375"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Block;
