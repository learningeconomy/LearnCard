import React from 'react';

const RibbonEnd: React.FC<{ side: 'left' | 'right'; className?: string; height?: string }> = ({
    side,
    className = '',
    height = '64',
}) => {
    const halfHeight = parseInt(height) / 2;
    return (
        <svg
            className={className}
            width="30"
            height={height}
            viewBox={`0 0 30 ${height}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ transform: `scaleX(${side === 'left' ? '1' : '-1'})` }}
        >
            <g filter="url(#filter0_d_4620_22659)">
                <path d={`M0 0H30V${height}H0L6.36364 ${halfHeight}L0 0Z`} fill="white" />
                <path
                    d={`M3.08593 2.5H27.5V${height}H3.08593L8.80922 ${halfHeight}L8.91926 30L8.80922 29.4812L3.08593 2.5Z`}
                    stroke="#EEF2FF"
                    strokeWidth="5"
                />
            </g>
            <defs>
                <filter
                    id="filter0_d_4620_22659"
                    x="0"
                    y="0"
                    width="30"
                    height={height}
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
                    <feOffset dy="4" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_4620_22659"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_4620_22659"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default RibbonEnd;
