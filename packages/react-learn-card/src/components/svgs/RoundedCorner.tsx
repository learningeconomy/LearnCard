import React from 'react';

type RoundedCornerProps = {
    className?: string;
};

const RoundedCorner: React.FC<RoundedCornerProps> = ({ className = '' }) => {
    return (
        <svg
            width="29"
            height="30"
            viewBox="0 0 29 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M27 2.42419C27 16.2348 15.8106 27.4242 2 27.4242"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="square"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default RoundedCorner;
