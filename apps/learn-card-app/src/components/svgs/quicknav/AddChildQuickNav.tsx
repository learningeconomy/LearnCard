import React from 'react';

const AddChildQuickNav: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="50"
            height="50"
            viewBox="0 0 50 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M25 43.75C35.3553 43.75 43.75 35.3553 43.75 25C43.75 14.6447 35.3553 6.25 25 6.25C14.6447 6.25 6.25 14.6447 6.25 25C6.25 35.3553 14.6447 43.75 25 43.75Z"
                fill="white"
            />
            <path
                d="M43.75 25C43.75 35.3553 35.3553 43.75 25 43.75C14.6447 43.75 6.25 35.3553 6.25 25C6.25 14.6447 14.6447 6.25 25 6.25"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-miterlimit="10"
                stroke-linecap="round"
            />
            <path
                d="M25 31.25C29.3147 31.25 32.8125 27.7522 32.8125 23.4375C32.8125 19.1228 29.3147 15.625 25 15.625C20.6853 15.625 17.1875 19.1228 17.1875 23.4375C17.1875 27.7522 20.6853 31.25 25 31.25Z"
                fill="#E2E3E9"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-miterlimit="10"
            />
            <path
                d="M12.4609 38.9402C13.6379 36.6262 15.4323 34.683 17.6454 33.3257C19.8585 31.9684 22.404 31.25 25.0002 31.25C27.5963 31.25 30.1418 31.9684 32.355 33.3257C34.5681 34.6829 36.3624 36.6262 37.5394 38.9402"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M31.3848 10.832H46.2806"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M38.834 3.38672V18.2826"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export default AddChildQuickNav;
