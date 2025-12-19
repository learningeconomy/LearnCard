import React from 'react';

const HexagonIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="77"
            height="85"
            viewBox="0 0 77 85"
            fill="none"
            className={className}
        >
            <path
                d="M76.4463 63.75V21.25L38.5019 0L0.553467 21.25V63.75L38.5019 85L76.4463 63.75Z"
                fill="#BEF264"
            />
        </svg>
    );
};

export default HexagonIcon;
