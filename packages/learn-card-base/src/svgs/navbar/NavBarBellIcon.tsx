import React from 'react';

export const NavBarBellIcon: React.FC<{
    className?: string;
    version?: string;
}> = ({ className, version = '1' }) => {
    if (version === '2') {
        return (
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <circle cx="20" cy="20" r="18" fill="#DBEAFE" />
                <path
                    d="M28.25 15.3335C28.25 13.2781 27.4335 11.3068 25.9801 9.85342C24.5267 8.40001 22.5554 7.5835 20.5 7.5835C18.4446 7.5835 16.4733 8.40001 15.0199 9.85342C13.5665 11.3068 12.75 13.2781 12.75 15.3335C12.75 24.3752 8.875 26.9585 8.875 26.9585H32.125C32.125 26.9585 28.25 24.3752 28.25 15.3335Z"
                    fill="white"
                    stroke="#18224E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M22.7345 32.125C22.5075 32.5165 22.1815 32.8414 21.7893 33.0673C21.3972 33.2932 20.9525 33.4121 20.5 33.4121C20.0474 33.4121 19.6028 33.2932 19.2106 33.0673C18.8184 32.8414 18.4925 32.5165 18.2654 32.125"
                    stroke="#18224E"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

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
                d="M28.25 15.3335C28.25 13.2781 27.4335 11.3068 25.9801 9.85342C24.5267 8.40001 22.5554 7.5835 20.5 7.5835C18.4446 7.5835 16.4733 8.40001 15.0199 9.85342C13.5665 11.3068 12.75 13.2781 12.75 15.3335C12.75 24.3752 8.875 26.9585 8.875 26.9585H32.125C32.125 26.9585 28.25 24.3752 28.25 15.3335Z"
                stroke="#6F7590"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M22.7345 32.125C22.5075 32.5165 22.1815 32.8414 21.7893 33.0673C21.3972 33.2932 20.9525 33.4121 20.5 33.4121C20.0474 33.4121 19.6028 33.2932 19.2106 33.0673C18.8184 32.8414 18.4925 32.5165 18.2654 32.125"
                stroke="#6F7590"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default NavBarBellIcon;
