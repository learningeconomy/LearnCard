import React from 'react';

const SproutIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M7.29163 20.834H17.7083"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10.4166 20.8327C16.1458 18.2285 11.25 14.166 13.5416 10.416"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9.89579 9.79186C11.0416 10.6252 11.7708 12.0835 12.2916 13.646C10.2083 14.0627 8.64579 14.0627 7.29163 13.3335C6.04163 12.7085 4.89579 11.3544 4.16663 8.95853C7.08329 8.4377 8.74996 8.95853 9.89579 9.79186Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M14.6875 6.24935C13.8933 7.49055 13.4938 8.94325 13.5417 10.416C15.5209 10.3118 16.9792 9.79102 18.0209 8.95768C19.0625 7.91602 19.6875 6.56185 19.7917 4.16602C16.9792 4.27018 15.625 5.20768 14.6875 6.24935Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export default SproutIcon;
