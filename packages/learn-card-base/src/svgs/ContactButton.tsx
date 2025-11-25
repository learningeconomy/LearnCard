import React from 'react';

type ContactButtonProps = {
    className?: string;
};

export const ContactButton: React.FC<ContactButtonProps> = ({ className = '' }) => {
    return (
        <svg
            width="44"
            height="44"
            viewBox="0 0 44 44"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect x="1" y="1" width="42" height="42" rx="21" fill="#18224E" />
            <rect x="1" y="1" width="42" height="42" rx="21" stroke="#EFF0F5" stroke-width="2" />
            <path
                d="M8.5 22C8.5 23.5188 9.73122 24.75 11.25 24.75C12.7688 24.75 14 23.5188 14 22C14 20.4812 12.7688 19.25 11.25 19.25C9.73122 19.25 8.5 20.4812 8.5 22Z"
                fill="#82E6DE"
            />
            <path
                d="M17.875 22H26.125"
                stroke="white"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M22 17.875V26.125"
                stroke="white"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path
                d="M30 22C30 23.5188 31.2312 24.75 32.75 24.75C34.2688 24.75 35.5 23.5188 35.5 22C35.5 20.4812 34.2688 19.25 32.75 19.25C31.2312 19.25 30 20.4812 30 22Z"
                fill="#FF8DFF"
            />
        </svg>
    );
};
