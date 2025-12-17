import React from 'react';

export const NavBarFormalCircleIcon: React.FC<{ className?: string; version?: string }> = ({
    className,
}) => {
    return (
        <svg
            width="81"
            height="80"
            viewBox="0 0 81 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <rect
                x="2"
                y="1.5"
                width="77"
                height="77"
                rx="38.5"
                fill="url(#paint0_linear_5689_7930)"
            />
            <rect x="2" y="1.5" width="77" height="77" rx="38.5" stroke="#EFF0F5" strokeWidth="3" />
            <g filter="url(#filter0_d_5689_7930)">
                <path
                    d="M25.8893 22.8605C29.5045 23.2913 31.6774 22.1299 33.0822 18.8894C33.6817 17.5032 35.405 17.0724 36.6038 17.9715C39.3199 20.0507 41.6801 20.0507 44.3962 17.9715C45.5763 17.0724 47.3183 17.5032 47.9178 18.8894C49.3039 22.1112 51.4768 23.2913 55.1107 22.8605C56.5718 22.6919 57.8081 23.9469 57.6395 25.3893C57.2087 29.0045 58.3701 31.1774 61.6106 32.5822C62.9968 33.1817 63.4276 34.905 62.5285 36.1038C60.4493 38.8199 60.4493 41.1801 62.5285 43.8962C63.4276 45.0763 62.9968 46.8183 61.6106 47.4178C58.3888 48.8039 57.2087 50.9768 57.6395 54.6107C57.8081 56.0718 56.5531 57.3081 55.1107 57.1395C51.4955 56.7087 49.3226 57.8701 47.9178 61.1106C47.3183 62.4968 45.595 62.9276 44.3962 62.0285C41.6801 59.9493 39.3199 59.9493 36.6038 62.0285C35.4237 62.9276 33.6817 62.4968 33.0822 61.1106C31.6961 57.8888 29.5232 56.7087 25.8893 57.1395C24.4282 57.3081 23.1919 56.0531 23.3605 54.6107C23.7913 50.9955 22.6299 48.8226 19.3894 47.4178C18.0032 46.8183 17.5724 45.095 18.4715 43.8962C20.5507 41.1801 20.5507 38.8199 18.4715 36.1038C17.5724 34.9237 18.0032 33.1817 19.3894 32.5822C22.6112 31.1961 23.7913 29.0232 23.3605 25.3893C23.1919 23.9282 24.4469 22.6919 25.8893 22.8605Z"
                    fill="white"
                />
            </g>
            <path
                d="M33.8623 40H46.2373"
                stroke="#18224E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M40.0498 33.8125V46.1875"
                stroke="#18224E"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <defs>
                <filter
                    id="filter0_d_5689_7930"
                    x="15"
                    y="16.5"
                    width="51"
                    height="51"
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
                        result="effect1_dropShadow_5689_7930"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_5689_7930"
                        result="shape"
                    />
                </filter>
                <linearGradient
                    id="paint0_linear_5689_7930"
                    x1="40.5"
                    y1="0"
                    x2="40.5"
                    y2="80"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stop-color="#3B82F6" />
                    <stop offset="0.754808" stop-color="#2563EB" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default NavBarFormalCircleIcon;
