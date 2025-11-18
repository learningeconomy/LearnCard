import React from 'react';

const Mail: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            className={className}
        >
            <path
                d="M4.16732 4.16797H20.834C21.9798 4.16797 22.9173 5.10547 22.9173 6.2513V18.7513C22.9173 19.8971 21.9798 20.8346 20.834 20.8346H4.16732C3.02148 20.8346 2.08398 19.8971 2.08398 18.7513V6.2513C2.08398 5.10547 3.02148 4.16797 4.16732 4.16797Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M22.9173 6.25L12.5007 13.5417L2.08398 6.25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Mail;
