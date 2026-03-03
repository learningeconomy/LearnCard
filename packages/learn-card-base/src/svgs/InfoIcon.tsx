import React from 'react';

export const InfoIcon: React.FC<{ className?: string; version?: 'thicker' | 'thinner' }> = ({
    className,
    version = 'thicker',
}) => {
    if (version === 'thinner') {
        return (
            <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path
                    d="M15 26.25C21.2132 26.25 26.25 21.2132 26.25 15C26.25 8.7868 21.2132 3.75 15 3.75C8.7868 3.75 3.75 8.7868 3.75 15C3.75 21.2132 8.7868 26.25 15 26.25Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M14.0625 14.0625H15.0001L15 20.625H15.9375"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M15 11.0156C15.6472 11.0156 16.1719 10.491 16.1719 9.84375C16.1719 9.19654 15.6472 8.67188 15 8.67188C14.3528 8.67188 13.8281 9.19654 13.8281 9.84375C13.8281 10.491 14.3528 11.0156 15 11.0156Z"
                    fill="currentColor"
                />
            </svg>
        );
    }

    return (
        <svg
            width="30"
            height="31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M15 26.6836C21.2132 26.6836 26.25 21.6468 26.25 15.4336C26.25 9.22039 21.2132 4.18359 15 4.18359C8.7868 4.18359 3.75 9.22039 3.75 15.4336C3.75 21.6468 8.7868 26.6836 15 26.6836Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14.0625 14.4961H15V21.0586H15.9375"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M15 11.6836C15.7767 11.6836 16.4062 11.054 16.4062 10.2773C16.4062 9.50069 15.7767 8.87109 15 8.87109C14.2233 8.87109 13.5938 9.50069 13.5938 10.2773C13.5938 11.054 14.2233 11.6836 15 11.6836Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default InfoIcon;
