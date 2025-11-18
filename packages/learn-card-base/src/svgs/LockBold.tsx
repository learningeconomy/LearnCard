import React from 'react';

export const LockBold: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            width="20"
            height="21"
            viewBox="0 0 20 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect
                x="2.66602"
                y="9.5"
                width="14.6667"
                height="9.66667"
                rx="2"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
            />
            <path
                d="M5.83398 9.33398V6.00065C5.83398 4.89558 6.27297 3.83577 7.05437 3.05437C7.83577 2.27297 8.89558 1.83398 10.0007 1.83398C11.1057 1.83398 12.1655 2.27297 12.9469 3.05437C13.7283 3.83577 14.1673 4.89558 14.1673 6.00065V9.33398"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default LockBold;
