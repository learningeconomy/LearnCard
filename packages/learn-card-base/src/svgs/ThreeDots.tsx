import React from 'react';

const ThreeDots: React.FC<{ className?: string; version?: string }> = ({
    className,
    version = '1',
}) => {
    if (version === '2') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="20"
                viewBox="0 0 21 20"
                fill="none"
                className={className}
            >
                <path
                    d="M10.5455 11.25C11.2358 11.25 11.7955 10.6904 11.7955 10C11.7955 9.30964 11.2358 8.75 10.5455 8.75C9.85512 8.75 9.29547 9.30964 9.29547 10C9.29547 10.6904 9.85512 11.25 10.5455 11.25Z"
                    fill="currentColor"
                />
                <path
                    d="M5.54547 11.25C6.23583 11.25 6.79547 10.6904 6.79547 10C6.79547 9.30964 6.23583 8.75 5.54547 8.75C4.85512 8.75 4.29547 9.30964 4.29547 10C4.29547 10.6904 4.85512 11.25 5.54547 11.25Z"
                    fill="currentColor"
                />
                <path
                    d="M15.5455 11.25C16.2358 11.25 16.7955 10.6904 16.7955 10C16.7955 9.30964 16.2358 8.75 15.5455 8.75C14.8551 8.75 14.2955 9.30964 14.2955 10C14.2955 10.6904 14.8551 11.25 15.5455 11.25Z"
                    fill="currentColor"
                />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={className}
        >
            <path
                d="M10 11.875C11.0355 11.875 11.875 11.0355 11.875 10C11.875 8.96447 11.0355 8.125 10 8.125C8.96447 8.125 8.125 8.96447 8.125 10C8.125 11.0355 8.96447 11.875 10 11.875Z"
                fill="currentColor"
                stroke="currentColor"
                strokeMiterlimit="10"
            />
            <path
                d="M10 5.625C11.0355 5.625 11.875 4.78553 11.875 3.75C11.875 2.71447 11.0355 1.875 10 1.875C8.96447 1.875 8.125 2.71447 8.125 3.75C8.125 4.78553 8.96447 5.625 10 5.625Z"
                fill="currentColor"
                stroke="currentColor"
                strokeMiterlimit="10"
            />
            <path
                d="M10 18.125C11.0355 18.125 11.875 17.2855 11.875 16.25C11.875 15.2145 11.0355 14.375 10 14.375C8.96447 14.375 8.125 15.2145 8.125 16.25C8.125 17.2855 8.96447 18.125 10 18.125Z"
                fill="currentColor"
                stroke="currentColor"
                strokeMiterlimit="10"
            />
        </svg>
    );
};

export default ThreeDots;
