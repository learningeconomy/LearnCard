import React from 'react';

export const CrescentCornerRight: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 21 21"
            fill="none"
            className={className}
        >
            <g filter="url(#filter0_d_12488_42985)">
                <path d="M20 1L3 18V1H20ZM3 1H20H3Z" fill="#EFF0F5" />
            </g>
            <defs>
                <filter
                    id="filter0_d_12488_42985"
                    x="0"
                    y="0"
                    width="21"
                    height="21"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                    />
                    <feOffset dx="-1" dy="1" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_12488_42985"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_12488_42985"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default CrescentCornerRight;
