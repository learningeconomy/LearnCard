import React from 'react';

type WarningCircleProps = {
    className?: string;
};

const WarningCircle: React.FC<WarningCircleProps> = ({ className = '' }) => {
    return (
        <svg
            className={className}
            width="61"
            height="61"
            viewBox="0 0 61 61"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M30.5 53C42.9264 53 53 42.9264 53 30.5C53 18.0736 42.9264 8 30.5 8C18.0736 8 8 18.0736 8 30.5C8 42.9264 18.0736 53 30.5 53Z"
                stroke="#18224E"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M30.5 19.25V32.375"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M30.5 43.1562C31.7944 43.1562 32.8438 42.1069 32.8438 40.8125C32.8438 39.5181 31.7944 38.4688 30.5 38.4688C29.2056 38.4688 28.1562 39.5181 28.1562 40.8125C28.1562 42.1069 29.2056 43.1562 30.5 43.1562Z"
                fill="#18224E"
            />
        </svg>
    );
};

export default WarningCircle;
