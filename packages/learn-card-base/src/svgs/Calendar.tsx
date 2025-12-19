import React from 'react';

const Calendar: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            viewBox="0 0 25 26"
            fill="none"
            className={className}
        >
            <path
                d="M3.22168 10.2961H21.7883"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.1271 14.3643H17.1367"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.505 14.3643H12.5147"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7.87269 14.3643H7.88234"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.1271 18.4127H17.1367"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.505 18.4127H12.5147"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M7.87269 18.4127H7.88234"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16.712 2.58334V6.01124"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.29744 2.58334V6.01124"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M16.9149 4.22833H8.09475C5.0357 4.22833 3.125 5.93243 3.125 9.06482V18.4915C3.125 21.6732 5.0357 23.4167 8.09475 23.4167H16.9052C19.9739 23.4167 21.875 21.7027 21.875 18.5703V9.06482C21.8846 5.93243 19.9836 4.22833 16.9149 4.22833Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default Calendar;
