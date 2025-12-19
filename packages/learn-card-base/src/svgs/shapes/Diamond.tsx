import React from 'react';

export const Diamond: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="82"
            height="80"
            viewBox="0 0 82 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Diamond"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M81.0711 32.4609L41 0L0.928711 32.4609L16.9093 80H65.0904L81.0711 32.4609Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default Diamond;
