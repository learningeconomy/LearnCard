import React from 'react';

type SlimCaretLeftProps = { className?: string };

const SlimCaretLeft: React.FC<SlimCaretLeftProps> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            className={className}
        >
            <path
                d="M18.75 24.375L9.375 15L18.75 5.625"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default SlimCaretLeft;
