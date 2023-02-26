import React from 'react';

type RoundedXProps = {
    className?: string;
};

const RoundedX: React.FC<RoundedXProps> = ({ className = '' }) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M18.75 5.25L5.25 18.75"
                stroke="#18224E"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M18.75 18.75L5.25 5.25"
                stroke="#18224E"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default RoundedX;
