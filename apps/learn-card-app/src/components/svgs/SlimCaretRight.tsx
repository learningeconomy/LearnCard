import React from 'react';

const SlimCaretRight: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="26"
            height="25"
            viewBox="0 0 26 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M9.875 4.6875L17.6875 12.5L9.875 20.3125"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default SlimCaretRight;
