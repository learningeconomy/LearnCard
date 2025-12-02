import React from 'react';

const SolidDiamondIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="75"
            height="74"
            viewBox="0 0 75 74"
            fill="none"
            className={className}
        >
            <path
                d="M74.2705 36.7676L37.501 -0.00195312L0.731425 36.7676L37.501 73.5372L74.2705 36.7676Z"
                fill="#F472B6"
            />
        </svg>
    );
};

export default SolidDiamondIcon;
