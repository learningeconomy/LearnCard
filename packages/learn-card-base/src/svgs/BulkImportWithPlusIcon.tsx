import React from 'react';

const BulkImportWithPlusIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <svg
            width="65"
            height="65"
            viewBox="0 0 65 65"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect width="65" height="65" rx="32.5" fill="url(#paint0_linear_4687_195097)" />
            <g filter="url(#filter0_d_4687_195097)">
                <path
                    d="M19.188 16.884C22.4819 17.2765 24.4616 16.2184 25.7416 13.2659C26.2877 12.0029 27.8579 11.6104 28.9501 12.4296C31.4248 14.324 33.5752 14.324 36.0499 12.4296C37.1251 11.6104 38.7123 12.0029 39.2584 13.2659C40.5213 16.2013 42.5011 17.2765 45.812 16.884C47.1432 16.7304 48.2696 17.8739 48.116 19.188C47.7235 22.4819 48.7816 24.4616 51.7341 25.7416C52.9971 26.2877 53.3896 27.8579 52.5704 28.9501C50.676 31.4248 50.676 33.5752 52.5704 36.0499C53.3896 37.1251 52.9971 38.7123 51.7341 39.2584C48.7987 40.5213 47.7235 42.5011 48.116 45.812C48.2696 47.1432 47.1261 48.2696 45.812 48.116C42.5181 47.7235 40.5384 48.7816 39.2584 51.7341C38.7123 52.9971 37.1421 53.3896 36.0499 52.5704C33.5752 50.676 31.4248 50.676 28.9501 52.5704C27.8749 53.3896 26.2877 52.9971 25.7416 51.7341C24.4787 48.7987 22.4989 47.7235 19.188 48.116C17.8568 48.2696 16.7304 47.1261 16.884 45.812C17.2765 42.5181 16.2184 40.5384 13.2659 39.2584C12.0029 38.7123 11.6104 37.1421 12.4296 36.0499C14.324 33.5752 14.324 31.4248 12.4296 28.9501C11.6104 27.8749 12.0029 26.2877 13.2659 25.7416C16.2013 24.4787 17.2765 22.4989 16.884 19.188C16.7304 17.8568 17.8739 16.7304 19.188 16.884Z"
                    fill="white"
                />
            </g>
            <path
                d="M24.4437 31.9141H40.5509"
                stroke="#18224E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M32.4972 23.8594V39.9665"
                stroke="#18224E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <defs>
                <filter
                    id="filter0_d_4687_195097"
                    x="9"
                    y="11"
                    width="47"
                    height="47"
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
                    <feOffset dy="2" />
                    <feGaussianBlur stdDeviation="1.5" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_4687_195097"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_4687_195097"
                        result="shape"
                    />
                </filter>
                <linearGradient
                    id="paint0_linear_4687_195097"
                    x1="0"
                    y1="32.5"
                    x2="65"
                    y2="32.5"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#B1EF6B" />
                    <stop offset="0.2" stopColor="#10B981" />
                    <stop offset="0.4" stopColor="#00A7C3" />
                    <stop offset="0.6" stopColor="#6366F1" />
                    <stop offset="0.8" stopColor="#F88DCA" />
                    <stop offset="1" stopColor="#FFD573" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default BulkImportWithPlusIcon;
