import React from 'react';

type MeritBadgeRibbonProps = {
    className?: string;
    image: string;
};

const MeritBadgeRibbon: React.FC<MeritBadgeRibbonProps> = ({ className = '', image }) => {
    return (
        <svg
            width="207"
            height="170"
            viewBox="0 0 207 170"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <g filter="url(#filter0_d_10755_290433)">
                <circle cx="102.988" cy="83" r="81.5" fill="white" stroke="white" strokeWidth="3" />
                <path
                    d="M3.94446 50C3.41654 50 2.92748 50.2775 2.65674 50.7307C2.38599 51.1839 2.37343 51.7461 2.62365 52.211L19.4659 83.5L2.62365 114.789C2.37343 115.254 2.386 115.816 2.65674 116.269C2.92748 116.722 3.41654 117 3.94446 117L203.056 117C203.583 117 204.073 116.722 204.343 116.269C204.614 115.816 204.627 115.254 204.376 114.789L187.534 83.5L204.376 52.211C204.627 51.7461 204.614 51.1839 204.343 50.7307C204.073 50.2775 203.583 50 203.056 50L3.94446 50Z"
                    fill="currentColor"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinejoin="round"
                />
                <rect
                    x="25.3273"
                    y="5.34741"
                    width="156.6"
                    height="156.6"
                    rx="78.2999"
                    fill="#FBFBFC"
                />
                <rect
                    x="25.3273"
                    y="5.34741"
                    width="156.6"
                    height="156.6"
                    rx="78.2999"
                    stroke="currentColor"
                    strokeWidth="3"
                />
                <rect x="29.8273" y="9.84741" width="147.6" height="147.6" fill="none" />
            </g>

            <clipPath id="circleClip">
                <circle cx="103.5" cy="84" r="75" />
            </clipPath>
            <image
                xlinkHref={image}
                x="28.5"
                y="9"
                width="150"
                height="150"
                clipPath="url(#circleClip)"
            />

            <defs>
                <filter
                    id="filter0_d_10755_290433"
                    x="0.944458"
                    y="0"
                    width="205.111"
                    height="170"
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
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_10755_290433"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_10755_290433"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
    return (
        <svg
            width="167"
            height="131"
            viewBox="0 0 167 131"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <circle cx="83.1426" cy="65.5" r="64" fill="white" stroke="white" strokeWidth="3" />
            <path
                d="M29.3926 3.70096C28.9354 3.437 28.3731 3.43281 27.912 3.68993C27.4509 3.94705 27.159 4.42762 27.1432 4.95531L26.3214 32.5274L2.85421 47.0252C2.40508 47.3026 2.13488 47.7958 2.14274 48.3236C2.15061 48.8515 2.43538 49.3363 2.89258 49.6003L137.608 127.378C138.065 127.642 138.627 127.646 139.088 127.389C139.549 127.132 139.841 126.651 139.857 126.124L140.679 98.5517L164.146 84.0539C164.595 83.7764 164.865 83.2833 164.857 82.7554C164.85 82.2276 164.565 81.7427 164.108 81.4787L29.3926 3.70096Z"
                fill="#622599"
                stroke="white"
                strokeWidth="3"
                strokeLinejoin="round"
            />
            <rect x="22.1426" y="4.5" width="123" height="123" rx="61.5" fill="white" />
            <rect
                x="22.1426"
                y="4.5"
                width="123"
                height="123"
                rx="61.5"
                stroke="#622599"
                strokeWidth="3"
            />
            <rect
                x="28.6426"
                y="11"
                width="110"
                height="110"
                rx="55"
                stroke="#622599"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="5 5"
            />
            <rect x="33.6426" y="16" width="100" height="100" fill="none" />
            <defs>
                <pattern
                    id="pattern0_10101_43072"
                    patternContentUnits="objectBoundingBox"
                    width="1"
                    height="1"
                >
                    <use xlinkHref="#image0_10101_43072" transform="scale(0.00416667)" />
                </pattern>
            </defs>
        </svg>
    );
};

export default MeritBadgeRibbon;
