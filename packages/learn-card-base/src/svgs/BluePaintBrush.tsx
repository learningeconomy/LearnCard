import React from 'react';

export const BluePaintBrush: React.FC<{ className?: string }> = ({ className }) => {
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
                d="M14.9997 13.333C11.6663 18.333 8.33301 19.1663 3.33301 19.9997L16.6663 36.6663C19.9997 34.9997 26.6663 28.333 26.6663 24.9997"
                fill="white"
            />
            <path d="M17 36.5L7.5 25L25 29.5C25 29.5 20.5 35 17 36.5Z" fill="#6EE7B7" />
            <path
                d="M14.9999 13.333C11.6666 18.333 8.33325 19.1663 3.33325 19.9997L16.6666 36.6663C19.9999 34.9997 26.6666 28.333 26.6666 24.9997"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M30.6163 4.38319L23.333 11.6665L20.683 9.01652C20.0585 8.39569 19.2136 8.04721 18.333 8.04721C17.4524 8.04721 16.6075 8.39569 15.983 9.01652L13.333 11.6665L28.333 26.6665L30.983 24.0165C31.6038 23.392 31.9523 22.5471 31.9523 21.6665C31.9523 20.7859 31.6038 19.9411 30.983 19.3165L28.333 16.6665L35.6163 9.38319C36.2794 8.72015 36.6519 7.82087 36.6519 6.88319C36.6519 5.94551 36.2794 5.04623 35.6163 4.38319C34.9533 3.72015 34.054 3.34766 33.1163 3.34766C32.1787 3.34766 31.2794 3.72015 30.6163 4.38319Z"
                fill="white"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M24.1667 29.1667L7.5 25"
                stroke="#06B6D4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default BluePaintBrush;
