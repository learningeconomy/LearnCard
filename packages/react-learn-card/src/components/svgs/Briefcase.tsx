import React from 'react';

export const Briefcase: React.FC<{ className?: string; size?: string }> = ({
    className = '',
    size = '',
}) => {
    return (
        <svg
            height={size}
            width={size}
            viewBox="0 0 31 31"
            fill="none"
            className={className}
            data-testid="job-icon"
        >
            <path
                d="M25.8135 8.9375H5.18848C4.67071 8.9375 4.25098 9.35723 4.25098 9.875V24.875C4.25098 25.3928 4.67071 25.8125 5.18848 25.8125H25.8135C26.3312 25.8125 26.751 25.3928 26.751 24.875V9.875C26.751 9.35723 26.3312 8.9375 25.8135 8.9375Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20.1875 8.9375V7.0625C20.1875 6.56522 19.99 6.08831 19.6383 5.73667C19.2867 5.38504 18.8098 5.1875 18.3125 5.1875H12.6875C12.1902 5.1875 11.7133 5.38504 11.3617 5.73667C11.01 6.08831 10.8125 6.56522 10.8125 7.0625V8.9375"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M26.7509 15.3018C23.3317 17.2799 19.4502 18.3186 15.5 18.3124C11.5504 18.3186 7.66951 17.2803 4.25073 15.3027"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14.0938 14.5625H16.9062"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Briefcase;
