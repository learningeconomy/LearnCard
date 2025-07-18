import React from 'react';

export const ThreeDotVertical = ({ className }: { className?: string }) => {
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
                d="M8.4375 10C8.4375 10.8629 9.13706 11.5625 10 11.5625C10.8629 11.5625 11.5625 10.8629 11.5625 10C11.5625 9.13706 10.8629 8.4375 10 8.4375C9.13706 8.4375 8.4375 9.13705 8.4375 10Z"
                fill="#6F7590"
                stroke="#6F7590"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M8.4375 16.25C8.4375 17.1129 9.13706 17.8125 10 17.8125C10.8629 17.8125 11.5625 17.1129 11.5625 16.25C11.5625 15.3871 10.8629 14.6875 10 14.6875C9.13706 14.6875 8.4375 15.3871 8.4375 16.25Z"
                fill="#6F7590"
                stroke="#6F7590"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M8.4375 3.75C8.4375 4.61294 9.13706 5.3125 10 5.3125C10.8629 5.3125 11.5625 4.61294 11.5625 3.75C11.5625 2.88706 10.8629 2.1875 10 2.1875C9.13706 2.1875 8.4375 2.88705 8.4375 3.75Z"
                fill="#6F7590"
                stroke="#6F7590"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
        </svg>
    );
};

export default ThreeDotVertical;
