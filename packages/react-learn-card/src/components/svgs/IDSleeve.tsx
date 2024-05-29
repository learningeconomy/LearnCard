import React from 'react';

export const IDSleeve: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="295"
            height="89"
            viewBox="0 0 295 89"
            fill="none"
            className={className}
        >
            <path
                d="M148.777 31.7103H146.223C116.199 31.7103 114.71 0 94.4184 0H0V88.0597H295V0H200.582C178.526 0 176.899 31.7103 148.777 31.7103Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default IDSleeve;
