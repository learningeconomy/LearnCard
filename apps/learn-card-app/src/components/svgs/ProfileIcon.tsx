import React from 'react';

export const ProfileIcon: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="31"
            viewBox="0 0 30 31"
            fill="none"
            className={className}
        >
            <path
                d="M15 26.6826C21.2132 26.6826 26.25 21.6458 26.25 15.4326C26.25 9.21941 21.2132 4.18262 15 4.18262C8.7868 4.18262 3.75 9.21941 3.75 15.4326C3.75 21.6458 8.7868 26.6826 15 26.6826Z"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeMiterlimit="10"
            />
            <path
                d="M15 19.1826C17.5888 19.1826 19.6875 17.084 19.6875 14.4951C19.6875 11.9063 17.5888 9.80762 15 9.80762C12.4112 9.80762 10.3125 11.9063 10.3125 14.4951C10.3125 17.084 12.4112 19.1826 15 19.1826Z"
                fill="#E2E3E9"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeMiterlimit="10"
            />
            <path
                d="M7.47656 23.7968C8.18275 22.4083 9.25936 21.2424 10.5872 20.428C11.9151 19.6137 13.4424 19.1826 15.0001 19.1826C16.5578 19.1826 18.0851 19.6137 19.413 20.428C20.7408 21.2424 21.8175 22.4083 22.5236 23.7967"
                stroke="#18224E"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default ProfileIcon;
