import React from 'react';

export const IDIcon: React.FC<{ className?: string; }> = ({ className, }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="35"
            height="36"
            viewBox="0 0 35 36"
            fill="none"
            className={className}
        >
            <path
                opacity="0.2"
                d="M5.875 27.4375V8.5625H29.125V27.4375H5.875ZM9.93554 20.8817C10.7218 21.4071 11.6462 21.6875 12.5919 21.6875C13.2197 21.6875 13.8415 21.5638 14.4216 21.3236C15.0017 21.0833 15.5287 20.7311 15.9727 20.2871C16.4167 19.8431 16.7689 19.316 17.0092 18.736C17.2494 18.1559 17.3731 17.5341 17.3731 16.9062C17.3731 15.9606 17.0927 15.0362 16.5673 14.2499C16.042 13.4637 15.2952 12.8508 14.4216 12.489C13.5479 12.1271 12.5866 12.0324 11.6591 12.2169C10.7316 12.4014 9.87968 12.8567 9.21101 13.5254C8.54234 14.1941 8.08697 15.046 7.90248 15.9735C7.71799 16.9009 7.81268 17.8623 8.17456 18.736C8.53644 19.6096 9.14927 20.3563 9.93554 20.8817Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="3"
            />
            <path
                d="M20.7812 15.8125H26.25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M20.7812 20.1875H26.25"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M12.5918 20.1875C14.404 20.1875 15.873 18.7184 15.873 16.9062C15.873 15.0941 14.404 13.625 12.5918 13.625C10.7796 13.625 9.31055 15.0941 9.31055 16.9062C9.31055 18.7184 10.7796 20.1875 12.5918 20.1875Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M8.35449 23.4687C8.59724 22.5295 9.14512 21.6977 9.91205 21.1037C10.679 20.5098 11.6215 20.1875 12.5915 20.1875C13.5615 20.1875 14.504 20.5097 15.271 21.1036C16.038 21.6974 16.5859 22.5293 16.8287 23.4684"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M29.5312 7.06251H5.46875C4.86469 7.06251 4.375 7.5522 4.375 8.15626V27.8438C4.375 28.4478 4.86469 28.9375 5.46875 28.9375H29.5312C30.1353 28.9375 30.625 28.4478 30.625 27.8438V8.15626C30.625 7.5522 30.1353 7.06251 29.5312 7.06251Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default IDIcon;
