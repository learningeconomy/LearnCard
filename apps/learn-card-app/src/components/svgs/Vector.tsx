import React from 'react';

type VectorProps = {
    className?: string;
    color?: string; // e.g. lime-300
};

const Vector: React.FC<VectorProps> = ({ className = '', color = 'lime-300' }) => {
    return (
        <svg
            width="70"
            height="56"
            viewBox="0 0 70 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className} text-${color}`}
        >
            <path
                d="M-2.44784e-06 56L56.8453 56L70 28.0015L56.8453 -5.7501e-07L0 -3.0598e-06L-2.44784e-06 56Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default Vector;
