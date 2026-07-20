import React from 'react';

const TwoToneLock: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="35"
            height="35"
            viewBox="0 0 35 35"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                opacity="0.4"
                d="M23.9508 13.7777V10.6467C23.9508 6.98191 20.9787 4.00983 17.3139 4.00983C13.6491 3.99379 10.6654 6.95129 10.6493 10.6175V10.6467V13.7777"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M22.8713 30.9886H11.7282C8.67446 30.9886 6.19821 28.5138 6.19821 25.4586V19.2038C6.19821 16.1486 8.67446 13.6738 11.7282 13.6738H22.8713C25.9251 13.6738 28.4013 16.1486 28.4013 19.2038V25.4586C28.4013 28.5138 25.9251 30.9886 22.8713 30.9886Z"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M17.3001 20.7129V23.9518"
                stroke="#18224E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default TwoToneLock;
