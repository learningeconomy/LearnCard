import React from 'react';

const Checkmark: React.FC<{
    className?: string;
    strokeWidth?: string;
    version?: 'default' | 'no-padding';
}> = ({ className = '', strokeWidth = '2', version = 'default' }) => {
    if (version === 'no-padding') {
        return (
            <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={className}
            >
                <path
                    d="M10.9688 3.65625L5.28125 9.3435L2.4375 6.5"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        );
    }

    // default, has bottom padding :shrug:
    return (
        <svg
            viewBox="0 0 26 27"
            fill="transparent"
            className={className}
            data-testid="checkmark-icon"
            aria-label="checkmark"
        >
            <g>
                <path
                    d="M21 7.25049L10.5 17.75L5.25 12.5005"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
            <defs>
                <filter
                    id="filter0_d_1165_663"
                    x="0.25"
                    y="6.25049"
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
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_1165_663"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_1165_663"
                        result="shape"
                    />
                </filter>
            </defs>
        </svg>
    );
};

export default Checkmark;
