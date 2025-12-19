import React from 'react';

const SwitchChildQuickNav: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="50"
            height="51"
            viewBox="0 0 50 51"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M25 44.0801C35.3553 44.0801 43.75 35.6854 43.75 25.3301C43.75 14.9747 35.3553 6.58008 25 6.58008C14.6447 6.58008 6.25 14.9747 6.25 25.3301C6.25 35.6854 14.6447 44.0801 25 44.0801Z"
                fill="white"
            />
            <path
                d="M43.75 25.3301C43.75 35.6854 35.3553 44.0801 25 44.0801C14.6447 44.0801 6.25 35.6854 6.25 25.3301C6.25 14.9747 14.6447 6.58008 25 6.58008"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-miterlimit="10"
                stroke-linecap="round"
            />
            <path
                d="M25 31.5801C29.3147 31.5801 32.8125 28.0823 32.8125 23.7676C32.8125 19.4529 29.3147 15.9551 25 15.9551C20.6853 15.9551 17.1875 19.4529 17.1875 23.7676C17.1875 28.0823 20.6853 31.5801 25 31.5801Z"
                fill="#E2E3E9"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-miterlimit="10"
            />
            <path
                d="M12.4609 39.2703C13.6379 36.9563 15.4323 35.0131 17.6454 33.6558C19.8585 32.2985 22.404 31.5801 25.0002 31.5801C27.5963 31.5801 30.1418 32.2985 32.355 33.6557C34.5681 35.013 36.3624 36.9562 37.5394 39.2703"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M32.6699 11L28.6699 7L32.6699 3"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M28.6699 7L40.6699 7"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M42.6699 21L46.6699 17L42.6699 13"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M34.6699 17L46.6699 17"
                stroke="#353E64"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export default SwitchChildQuickNav;
