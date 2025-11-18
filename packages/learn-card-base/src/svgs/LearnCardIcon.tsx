import React from 'react';

const LearnCardIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="36"
            height="35"
            viewBox="0 0 36 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect
                x="2.95834"
                y="6.83325"
                width="30.0833"
                height="22.7917"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
            />
            <path d="M1.95834 14.5833H34.0417" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
};

export const ColorfulLearnCardIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M33.75 7.5H6.25C5.55964 7.5 5 8.05964 5 8.75V31.25C5 31.9404 5.55964 32.5 6.25 32.5H33.75C34.4404 32.5 35 31.9404 35 31.25V8.75C35 8.05964 34.4404 7.5 33.75 7.5Z"
                fill="white"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.25 8.375C6.04289 8.375 5.875 8.54289 5.875 8.75V31.25C5.875 31.4571 6.04289 31.625 6.25 31.625H33.75C33.9571 31.625 34.125 31.4571 34.125 31.25V8.75C34.125 8.54289 33.9571 8.375 33.75 8.375H6.25ZM4.125 8.75C4.125 7.57639 5.07639 6.625 6.25 6.625H33.75C34.9236 6.625 35.875 7.57639 35.875 8.75V31.25C35.875 32.4236 34.9236 33.375 33.75 33.375H6.25C5.07639 33.375 4.125 32.4236 4.125 31.25V8.75Z"
                fill="#0EA5E9"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M23.875 17.5C23.875 17.0168 24.2668 16.625 24.75 16.625H31C31.4832 16.625 31.875 17.0168 31.875 17.5C31.875 17.9832 31.4832 18.375 31 18.375H24.75C24.2668 18.375 23.875 17.9832 23.875 17.5Z"
                fill="#7C3AED"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M23.875 22.5C23.875 22.0168 24.2668 21.625 24.75 21.625H31C31.4832 21.625 31.875 22.0168 31.875 22.5C31.875 22.9832 31.4832 23.375 31 23.375H24.75C24.2668 23.375 23.875 22.9832 23.875 22.5Z"
                fill="#EC4899"
            />
            <path
                d="M15 26C18.3137 26 21 23.3137 21 20C21 16.6863 18.3137 14 15 14C11.6863 14 9 16.6863 9 20C9 23.3137 11.6863 26 15 26Z"
                fill="#18224E"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15 14.875C12.1695 14.875 9.875 17.1695 9.875 20C9.875 22.8305 12.1695 25.125 15 25.125C17.8305 25.125 20.125 22.8305 20.125 20C20.125 17.1695 17.8305 14.875 15 14.875ZM8.125 20C8.125 16.203 11.203 13.125 15 13.125C18.797 13.125 21.875 16.203 21.875 20C21.875 23.797 18.797 26.875 15 26.875C11.203 26.875 8.125 23.797 8.125 20Z"
                fill="#18224E"
            />
            <path d="M12 16H13.8947V22.4914H18V24H12V16Z" fill="white" />
        </svg>
    );
};

export default LearnCardIcon;
