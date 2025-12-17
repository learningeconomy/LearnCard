import React from 'react';

const LocationIcon: React.FC<{ className?: string; strokeWidth?: string }> = ({
    className = '',
    strokeWidth = '2',
}) => {
    return (
        <svg
            width="45"
            height="46"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M32.9168 21.9583C32.9168 26.5128 26.3881 32.3433 23.6679 34.5748C22.9824 35.1372 22.0179 35.1372 21.3324 34.5748C18.6123 32.3433 12.0835 26.5128 12.0835 21.9583C12.0835 16.2053 16.7472 11.5416 22.5002 11.5416C28.2531 11.5416 32.9168 16.2053 32.9168 21.9583Z"
                stroke="currentColor"
                strokeWidth={strokeWidth}
            />
            <circle
                cx="22.5"
                cy="21.9584"
                r="3.125"
                stroke="currentColor"
                strokeWidth={strokeWidth}
            />
        </svg>
    );
};

export default LocationIcon;
