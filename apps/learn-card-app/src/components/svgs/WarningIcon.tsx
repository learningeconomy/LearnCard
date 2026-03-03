import React from 'react';

const WarningIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            viewBox="0 0 33 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M16.5 12V17"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14.769 4.99809L3.77198 23.9971C3.59602 24.3011 3.50322 24.6461 3.50293 24.9974C3.50264 25.3486 3.59487 25.6938 3.77033 25.9981C3.94579 26.3024 4.1983 26.5551 4.50246 26.7308C4.80661 26.9065 5.15167 26.999 5.50294 26.999H27.497C27.8483 26.999 28.1933 26.9065 28.4975 26.7308C28.8016 26.5551 29.0541 26.3024 29.2296 25.9981C29.4051 25.6938 29.4973 25.3486 29.497 24.9974C29.4967 24.6461 29.4039 24.3011 29.2279 23.9971L18.2309 4.99809C18.0552 4.69457 17.8028 4.44258 17.499 4.2674C17.1952 4.09222 16.8507 4 16.5 4C16.1493 4 15.8047 4.09222 15.5009 4.2674C15.1971 4.44258 14.9447 4.69457 14.769 4.99809V4.99809Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16.5 24C17.6046 24 18.5 23.1046 18.5 22C18.5 20.8954 17.6046 20 16.5 20C15.3954 20 14.5 20.8954 14.5 22C14.5 23.1046 15.3954 24 16.5 24Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default WarningIcon;
