import React from 'react';

const SolidCircleIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="63"
            height="63"
            viewBox="0 0 63 63"
            fill="none"
            className={className}
        >
            <circle opacity="0.5" cx="31.5" cy="31.5" r="31.5" fill="#67E8F9" />
        </svg>
    );
};

export default SolidCircleIcon;
