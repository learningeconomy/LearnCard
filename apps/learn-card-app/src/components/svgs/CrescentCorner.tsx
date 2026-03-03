import React from 'react';

export const CrescentCorner: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 21 21"
            fill="none"
            className={className}
        >
            <g filter="url(#filter0_d_12488_42984)">
                <path d="M1 1L18 18V1H1ZM18 1H1H18Z" fill="#EFF0F5" />
            </g>
            <defs>
                <filter
                    id="filter0_d_12488_42984"
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
                    <feOffset dx="1" dy="1" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_12488_42984"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_12488_42984"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default CrescentCorner;
