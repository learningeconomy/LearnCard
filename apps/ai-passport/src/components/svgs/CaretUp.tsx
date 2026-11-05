import React from 'react';

type CaretUpProps = {
    className?: string;
};

const CaretUp: React.FC<CaretUpProps> = ({ className = '' }) => {
    return (
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M3.75 12.5L10 6.25L16.25 12.5"
                stroke="#18224E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default CaretUp;
