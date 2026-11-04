import React from 'react';

type CaretRightProps = {
    className?: string;
};

const CaretRight: React.FC<CaretRightProps> = ({ className = '' }) => {
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
                d="M7.5 3.75L13.75 10L7.5 16.25"
                stroke="#A8ACBD"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default CaretRight;
