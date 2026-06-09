import React from 'react';

const TwoToneTimeCircle: React.FC<{ className?: string }> = ({ className = '' }) => {
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
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M30.9893 17.4993C30.9893 24.95 24.9503 30.9889 17.4997 30.9889C10.0491 30.9889 4.01012 24.95 4.01012 17.4993C4.01012 10.0487 10.0491 4.00977 17.4997 4.00977C24.9503 4.00977 30.9893 10.0487 30.9893 17.4993Z"
                stroke="#18224E"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                opacity="0.4"
                d="M22.5041 21.7917L17.0062 18.5119V11.4434"
                stroke="#18224E"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export default TwoToneTimeCircle;
