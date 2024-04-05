import React from 'react';

const AccomplishmentsIcon: React.FC<{ className?: string; size?: string }> = ({
    className = '',
    size = '21',
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M9.55107 11.5523L12.6845 14.6763L21.2944 6.06641"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M19.2562 15.1049C17.5418 18.9907 12.9988 20.7527 9.11295 19.0384C5.22709 17.324 3.46511 12.781 5.17947 8.89511C6.89382 5.00925 11.4368 3.24728 15.3227 4.96163"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default AccomplishmentsIcon;
