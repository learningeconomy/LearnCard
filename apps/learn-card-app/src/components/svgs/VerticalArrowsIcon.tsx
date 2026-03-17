import React from 'react';

export const VerticalArrowsIcon: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={className}
        >
            <path
                d="M6.66675 15L10.0001 18.3333L13.3334 15"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M6.66675 4.99984L10.0001 1.6665L13.3334 4.99984"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10 1.6665V18.3332"
                stroke="#52597A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default VerticalArrowsIcon;
