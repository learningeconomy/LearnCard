import React from 'react';

type PentagonProps = {
    className?: string;
};

const Pentagon: React.FC<PentagonProps> = ({ className = '' }) => {
    return (
        <svg
            width="81"
            height="80"
            viewBox="0 0 81 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Pentagon"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M80.25 32.4609L40.2501 0L0.25 32.4609L16.2022 80H64.2977L80.25 32.4609Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default Pentagon;
