import React from 'react';

type NotchProps = {
    className?: string;
};

const Notch: React.FC<NotchProps> = ({ className = '' }) => {
    return (
        <svg
            width="153"
            height="106"
            viewBox="0 0 153 106"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g filter="url(#filter0_d_3596_123848)">
                <path
                    d="M74.8762 65.7102H78.1238C116.29 65.7102 118.182 101 143.977 101L149 101V3L4 3V101L9.02338 101C37.0608 101 39.1285 65.7102 74.8762 65.7102Z"
                    fill="#FBFBFC"
                />
            </g>
            <defs>
                <filter
                    id="filter0_d_3596_123848"
                    x="0"
                    y="0"
                    width="153"
                    height="106"
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
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_3596_123848"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_3596_123848"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default Notch;
