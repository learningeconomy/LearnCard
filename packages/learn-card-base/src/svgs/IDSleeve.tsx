import React from 'react';

export const IDSleeve: React.FC<{ className?: string; version?: string }> = ({
    className,
    version,
}) => {
    if (version === '2') {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="335"
                height="41"
                viewBox="0 0 335 41"
                fill="none"
                className={className}
            >
                <path
                    d="M168.951 40.2898H166.049C131.955 40.2898 130.264 5 107.221 5H0V103H335V5H227.779C202.732 5 200.885 40.2898 168.951 40.2898Z"
                    fill="currentColor"
                />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="335"
            height="41"
            viewBox="0 0 335 41"
            fill="none"
            className={className}
        >
            <g filter="url(#filter0_d_11633_52378)">
                <path
                    d="M168.951 40.2898H166.049C131.955 40.2898 130.264 5 107.221 5H0V103H335V5H227.779C202.732 5 200.885 40.2898 168.951 40.2898Z"
                    fill="white"
                />
            </g>
            <defs>
                <filter
                    id="filter0_d_11633_52378"
                    x="-4"
                    y="0"
                    width="343"
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
                    <feOffset dy="-1" />
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_11633_52378"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_11633_52378"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default IDSleeve;
