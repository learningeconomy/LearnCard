import React from 'react';

interface ShieldMaskProps {
    className?: string;
    imageUrl?: string; // New prop for the image
}

export const ShieldMask: React.FC<ShieldMaskProps> = ({ className, imageUrl }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="142"
            height="178"
            viewBox="0 0 142 178"
            fill="none"
            className={className}
        >
            <defs>
                {/* Define the mask using your existing shield path */}
                <mask id="shield-mask">
                    <path
                        d="M135.516 24.4407C107.418 28.8518 103.464 4 71 4C38.5359 4 34.581 28.8518 6.48435 24.4407C6.48435 36.7875 2.16799 111.317 19.306 130.556C36.7374 154.984 56.6714 154.223 71 169C85.3286 154.223 105.263 154.984 122.694 130.556C139.832 111.317 135.516 36.7875 135.516 24.4407Z"
                        fill="white" // White areas in mask will show the image
                    />
                </mask>
                <filter
                    id="filter0_d_12414_332126"
                    x="0.000610352"
                    y="0"
                    width="141.999"
                    height="177.873"
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
                    <feGaussianBlur stdDeviation="2" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_12414_332126"
                    />
                    <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_12414_332126"
                        result="shape"
                    />
                </filter>
            </defs>

            {/* Add the image if URL is provided */}
            {imageUrl && (
                <image
                    href={imageUrl}
                    width="100%"
                    height="100%"
                    preserveAspectRatio="xMidYMid slice"
                    mask="url(#shield-mask)"
                />
            )}

            {/* Keep your original shield outline */}
            <g filter="url(#filter0_d_12414_332126)">
                <path
                    d="M135.516 24.4407C107.418 28.8518 103.464 4 71 4C38.5359 4 34.581 28.8518 6.48435 24.4407C6.48435 36.7875 2.16799 111.317 19.306 130.556C36.7374 154.984 56.6714 154.223 71 169C85.3286 154.223 105.263 154.984 122.694 130.556C139.832 111.317 135.516 36.7875 135.516 24.4407Z"
                    fill={imageUrl ? 'none' : 'white'} // Only fill white if no image
                />
                <path
                    d="M136.516 24.4407V23.2715L135.361 23.4528C128.497 24.5303 123.15 23.818 118.48 22.1651C113.783 20.5022 109.736 17.8775 105.447 15.0405C105.295 14.94 105.143 14.8393 104.991 14.7384C96.5368 9.14275 87.2565 3 71 3C54.7434 3 45.4629 9.14281 37.009 14.7385C36.8566 14.8393 36.7045 14.94 36.5527 15.0405C32.2638 17.8775 28.2166 20.5022 23.5192 22.1651C18.85 23.818 13.5029 24.5303 6.63944 23.4528L5.48435 23.2715V24.4407C5.48435 25.8821 5.424 28.2029 5.34591 31.2055C5.09382 40.8998 4.6569 57.7013 5.46953 74.9609C6.00223 86.275 7.07269 97.8376 9.0925 107.794C11.098 117.681 14.071 126.155 18.5231 131.18C27.3553 143.54 36.8343 149.538 45.8509 154.282C47.4961 155.148 49.1179 155.968 50.7127 156.775C57.8994 160.412 64.5367 163.771 70.2821 169.696L71 170.437L71.7179 169.696C77.4633 163.771 84.1006 160.412 91.2873 156.775C92.8821 155.968 94.5039 155.148 96.1491 154.282C105.166 149.538 114.645 143.54 123.477 131.18C127.929 126.155 130.902 117.681 132.908 107.794C134.927 97.8376 135.998 86.275 136.53 74.9609C137.343 57.7013 136.906 40.8998 136.654 31.2055C136.576 28.2029 136.516 25.8821 136.516 24.4407Z"
                    stroke="white"
                    strokeWidth="2"
                />
            </g>
        </svg>
    );
};

export default ShieldMask;
