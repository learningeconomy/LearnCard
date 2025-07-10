import React from 'react';

export const AwardDisplayIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="26"
            height="25"
            viewBox="0 0 26 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g clip-path="url(#clip0_2799_154595)">
                <path
                    d="M4.66309 2.85742L25.7499 15.0319L21.9691 17.3676L21.8366 21.8098L0.749867 9.63532L4.53068 7.29957L4.66309 2.85742Z"
                    fill="white"
                />
                <rect
                    x="3.91406"
                    y="3.04492"
                    width="18.7299"
                    height="18.7299"
                    rx="9.36497"
                    fill="white"
                />
                <circle cx="13.2793" cy="12.4102" r="7.5" fill="#E2E3E9" />
            </g>
            <defs>
                <clipPath id="clip0_2799_154595">
                    <rect width="25" height="25" fill="white" transform="translate(0.75)" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default AwardDisplayIcon;
