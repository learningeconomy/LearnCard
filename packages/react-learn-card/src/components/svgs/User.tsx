import React from 'react';

export const User: React.FC<{ className?: string; size?: string }> = ({
    className = '',
    size = '',
}) => {
    return (
        <svg
            height={size}
            width={size}
            viewBox="0 0 31 31"
            fill="none"
            className={className}
            data-testid="id-icon"
        >
            <path
                d="M15.5 19.25C19.6421 19.25 23 15.8921 23 11.75C23 7.60786 19.6421 4.25 15.5 4.25C11.3579 4.25 8 7.60786 8 11.75C8 15.8921 11.3579 19.25 15.5 19.25Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M4.13159 25.8114C5.2842 23.8164 6.94153 22.1598 8.93708 21.008C10.9326 19.8563 13.1961 19.25 15.5002 19.25C17.8043 19.25 20.0678 19.8564 22.0633 21.0082C24.0588 22.1599 25.7161 23.8166 26.8687 25.8116"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default User;
